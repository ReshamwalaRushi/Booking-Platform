import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { User } from '../../types';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const result = await api.adminGetUsers();
        setUsers(result.data);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleStatus = async (u: User) => {
    setActionLoading(u.id);
    try {
      const updated = await api.adminUpdateUserStatus(u.id, !u.isActive);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      toast.success(`User ${updated.isActive ? 'activated' : 'suspended'}`);
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive) ||
        (statusFilter === 'suspended' && !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const allSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((u) => next.add(u.id));
        return next;
      });
    }
  };

  const handleBulkSuspend = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selected).map((id) => api.adminUpdateUserStatus(id, false)));
      setUsers((prev) => prev.map((u) => (selected.has(u.id) ? { ...u, isActive: false } : u)));
      toast.success(`Suspended ${selected.size} users`);
      setSelected(new Set());
    } catch {
      toast.error('Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Name', 'Email', 'Role', 'Status'],
      ...filtered.map((u) => [`${u.firstName} ${u.lastName}`, u.email, u.role, u.isActive ? 'Active' : 'Suspended']),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const roleOptions = [
    { label: 'All Roles', value: 'all' },
    { label: 'Clients', value: 'client' },
    { label: 'Business Owners', value: 'business_owner' },
    { label: 'Admins', value: 'admin' },
  ];
  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <span className="badge-glow text-xs">Admin</span>
        <h1 className="text-2xl font-bold mt-3" style={{ color: 'var(--text-primary)' }}>Manage Users</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>View, filter and manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="card-glow mb-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input-field pl-9 text-sm py-2"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Role filter */}
        <select
          className="input-field text-sm py-2 w-44"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Status filter */}
        <select
          className="input-field text-sm py-2 w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div className="flex gap-2 ml-auto">
          {selected.size > 0 && (
            <Button size="sm" variant="danger" isLoading={bulkLoading} onClick={handleBulkSuspend}>
              Suspend {selected.size} selected
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="card-glow p-0 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner className="py-16" />
        ) : filtered.length === 0 ? (
          <p className="text-sm py-10 text-center" style={{ color: 'var(--text-muted)' }}>No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Name</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Email</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Role</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-right py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b table-row-hover transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3 px-4">
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</p>
                    </td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td className="py-3 px-4 capitalize" style={{ color: 'var(--text-secondary)' }}>{u.role.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25'}`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant={u.isActive ? 'danger' : 'primary'} isLoading={actionLoading === u.id} onClick={() => handleToggleStatus(u)}>
                        {u.isActive ? 'Suspend' : 'Activate'}
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
        Showing {filtered.length} of {users.length} users
      </p>
    </div>
  );
}
