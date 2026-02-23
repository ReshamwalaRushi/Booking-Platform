import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Business } from '../../types';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface AdminStats {
  totalBusinesses?: number;
  totalClients?: number;
  totalBookings?: number;
  totalRevenue?: number;
  [key: string]: unknown;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({});
  const [pendingBusinesses, setPendingBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, pending] = await Promise.all([
          api.getAdminStats(),
          api.getPendingBusinesses(),
        ]);
        setStats(statsData as AdminStats);
        setPendingBusinesses(pending);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVerify = async (id: string, approved: boolean) => {
    setActionLoading(id);
    try {
      await api.verifyBusiness(id, approved);
      setPendingBusinesses((prev) => prev.filter((b) => b._id !== id));
      toast.success(approved ? 'Business approved' : 'Business rejected');
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    { label: 'Total Businesses', value: stats.totalBusinesses ?? '—', color: 'bg-blue-50 text-blue-700', icon: '🏢' },
    { label: 'Total Clients', value: stats.totalClients ?? '—', color: 'bg-green-50 text-green-700', icon: '👥' },
    { label: 'Total Bookings', value: stats.totalBookings ?? '—', color: 'bg-primary-50 text-primary-700', icon: '📅' },
    { label: 'Revenue', value: stats.totalRevenue != null ? `$${Number(stats.totalRevenue).toFixed(2)}` : '—', color: 'bg-yellow-50 text-yellow-700', icon: '💰' },
  ];

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform overview and pending actions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className={`card ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold mb-1">{String(s.value)}</div>
            <div className="text-sm font-medium opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Business Approvals</h2>
        {pendingBusinesses.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No pending businesses</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Business</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBusinesses.map((b) => (
                  <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{b.name}</p>
                      <p className="text-xs text-gray-500">{b.email}</p>
                    </td>
                    <td className="py-3 px-4 capitalize text-gray-700">{b.category}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={actionLoading === b._id}
                        onClick={() => handleVerify(b._id, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        isLoading={actionLoading === b._id}
                        onClick={() => handleVerify(b._id, false)}
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
