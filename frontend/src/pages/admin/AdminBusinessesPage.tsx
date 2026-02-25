import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Business } from '../../types';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

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

  const categories = useMemo(() => {
    const cats = new Set(businesses.map((b) => b.category));
    return ['all', ...Array.from(cats)];
  }, [businesses]);

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch = !q || b.name.toLowerCase().includes(q) || (b.email ?? '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && b.isActive) ||
        (statusFilter === 'inactive' && !b.isActive) ||
        (statusFilter === 'verified' && b.isVerified) ||
        (statusFilter === 'unverified' && !b.isVerified);
      const matchCategory = categoryFilter === 'all' || b.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [businesses, search, statusFilter, categoryFilter]);

  const allSelected = filtered.length > 0 && filtered.every((b) => selected.has(b._id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((b) => n.delete(b._id)); return n; });
    } else {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((b) => n.add(b._id)); return n; });
    }
  };

  const handleBulkSuspend = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selected).map((id) => api.adminUpdateBusinessStatus(id, false)));
      setBusinesses((prev) => prev.map((b) => (selected.has(b._id) ? { ...b, isActive: false } : b)));
      toast.success(`Suspended ${selected.size} businesses`);
      setSelected(new Set());
    } catch {
      toast.error('Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Name', 'Email', 'Category', 'Status', 'Verified'],
      ...filtered.map((b) => [b.name, b.email ?? '', b.category, b.isActive ? 'Active' : 'Inactive', b.isVerified ? 'Yes' : 'No']),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'businesses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Verified', value: 'verified' },
    { label: 'Unverified', value: 'unverified' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <span className="badge-glow text-xs">Admin</span>
        <h1 className="text-2xl font-bold mt-3" style={{ color: 'var(--text-primary)' }}>Manage Businesses</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>View, filter and manage all platform businesses</p>
      </div>

      {/* Filters */}
      <div className="card-glow mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input-field pl-9 text-sm py-2"
            placeholder="Search businesses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="input-field text-sm py-2 w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select className="input-field text-sm py-2 w-44" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          {categories.map((c) => <option key={c} value={c} className="capitalize">{c === 'all' ? 'All Categories' : c}</option>)}
        </select>

        <div className="flex gap-2 ml-auto">
          {selected.size > 0 && (
            <Button size="sm" variant="danger" isLoading={bulkLoading} onClick={handleBulkSuspend}>
              Suspend {selected.size} selected
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <div className="card-glow p-0 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner className="py-16" />
        ) : filtered.length === 0 ? (
          <p className="text-sm py-10 text-center" style={{ color: 'var(--text-muted)' }}>No businesses found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Business</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Category</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Verified</th>
                  <th className="text-right py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b._id} className="border-b table-row-hover transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3 px-4">
                      <input type="checkbox" checked={selected.has(b._id)} onChange={() => toggleSelect(b._id)} className="rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{b.email}</p>
                    </td>
                    <td className="py-3 px-4 capitalize" style={{ color: 'var(--text-secondary)' }}>{b.category}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.isVerified ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'}`}>
                        {b.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant={b.isActive ? 'danger' : 'primary'} isLoading={actionLoading === b._id} onClick={() => handleToggleStatus(b)}>
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

      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        Showing {filtered.length} of {businesses.length} businesses
      </p>
    </div>
  );
}
