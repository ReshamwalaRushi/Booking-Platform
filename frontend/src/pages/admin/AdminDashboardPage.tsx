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
    { label: 'Total Businesses', value: stats.totalBusinesses ?? '—', cardClass: 'stat-card-blue', icon: '🏢', pct: 72 },
    { label: 'Total Clients', value: stats.totalClients ?? '—', cardClass: 'stat-card-green', icon: '👥', pct: 85 },
    { label: 'Total Bookings', value: stats.totalBookings ?? '—', cardClass: 'stat-card-purple', icon: '📅', pct: 91 },
    { label: 'Revenue', value: stats.totalRevenue != null ? `$${Number(stats.totalRevenue).toFixed(2)}` : '—', cardClass: 'stat-card-orange', icon: '💰', pct: 64 },
  ];

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <span className="badge-glow text-xs">Admin Panel</span>
        <h1 className="text-3xl font-bold text-white mt-3">
          Platform <span className="gradient-text">Overview</span>
        </h1>
        <p className="text-slate-400 mt-1">Monitor platform health and manage pending approvals.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.cardClass} relative overflow-hidden`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-4xl font-extrabold mb-1 tracking-tight">{String(s.value)}</div>
            <div className="text-sm font-medium opacity-80 mb-4">{s.label}</div>
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div className="bg-white/80 h-1.5 rounded-full transition-all duration-700" style={{ width: `${s.pct}%` }} />
            </div>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10" />
          </div>
        ))}
      </div>

      {/* Pending approvals */}
      <div className="card-glow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Pending Business Approvals</h2>
            <p className="text-sm text-slate-400 mt-0.5">Review and approve new business registrations</p>
          </div>
          {pendingBusinesses.length > 0 && (
            <span className="badge-glow text-xs">{pendingBusinesses.length} pending</span>
          )}
        </div>

        {pendingBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-slate-400">All caught up — no pending businesses</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left py-3 px-4 font-semibold text-slate-400">Business</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-400">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-400">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBusinesses.map((b) => (
                  <tr key={b._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{b.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{b.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
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
