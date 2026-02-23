import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Business } from '../../types';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

type StatusFilter = 'all' | 'active' | 'inactive' | 'verified';

export function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true);
      try {
        const result = await api.adminGetBusinesses();
        setBusinesses(result.data);
      } catch {
        toast.error('Failed to load businesses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  const handleToggleStatus = async (b: Business) => {
    setActionLoading(b._id);
    try {
      const updated = await api.adminUpdateBusinessStatus(b._id, !b.isActive);
      setBusinesses((prev) => prev.map((x) => (x._id === b._id ? updated : x)));
      toast.success(`Business ${updated.isActive ? 'activated' : 'suspended'}`);
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = businesses.filter((b) => {
    if (filter === 'active') return b.isActive;
    if (filter === 'inactive') return !b.isActive;
    if (filter === 'verified') return b.isVerified;
    return true;
  });

  const filters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Verified', value: 'verified' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Businesses</h1>
        <p className="text-gray-600 mt-1">View and manage all platform businesses</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner className="py-16" />
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm py-10 text-center">No businesses found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Business</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Verified</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{b.name}</p>
                      <p className="text-xs text-gray-500">{b.email}</p>
                    </td>
                    <td className="py-3 px-4 capitalize text-gray-700">{b.category}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${b.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${b.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                        {b.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant={b.isActive ? 'danger' : 'primary'}
                        isLoading={actionLoading === b._id}
                        onClick={() => handleToggleStatus(b)}
                      >
                        {b.isActive ? 'Suspend' : 'Activate'}
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
