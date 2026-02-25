import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import api from '../../services/api';
import { Business } from '../../types';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface AdminStats {
  totalBusinesses?: number;
  totalClients?: number;
  totalBookings?: number;
  totalRevenue?: number;
  totalActiveUsers?: number;
  bookingsByStatus?: Record<string, number>;
  monthlyData?: { month: string; bookings: number; revenue: number }[];
  [key: string]: unknown;
}

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-xl text-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === 'revenue' ? `$${Number(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
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

  const pieData = stats.bookingsByStatus
    ? Object.entries(stats.bookingsByStatus).map(([name, value]) => ({ name, value }))
    : [];

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <span className="badge-glow text-xs">Admin Panel</span>
        <h1 className="text-3xl font-bold mt-3" style={{ color: 'var(--text-primary)' }}>
          Platform <span className="gradient-text">Overview</span>
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Real-time platform health and statistics.</p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Bookings */}
        <div className="card-glow">
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Monthly Bookings (6 months)</h2>
          {stats.monthlyData && stats.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.monthlyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,.12)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipContent />} />
                <Bar dataKey="bookings" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No booking data yet</p>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className="card-glow">
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Monthly Revenue (6 months)</h2>
          {stats.monthlyData && stats.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.monthlyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,.12)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<TooltipContent />} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No revenue data yet</p>
          )}
        </div>

        {/* Bookings by Status Pie */}
        {pieData.length > 0 && (
          <div className="card-glow">
            <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Bookings by Status</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<TooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Platform Health */}
        <div className="card-glow">
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Platform Health</h2>
          <div className="space-y-3">
            {[
              { label: 'Active Users', value: stats.totalActiveUsers ?? 0, total: stats.totalClients ?? 1, color: '#10b981' },
              { label: 'Verified Businesses', value: stats.totalBusinesses ?? 0, total: Math.max(stats.totalBusinesses as number ?? 1, 1), color: '#6366f1' },
              { label: 'Completed Bookings', value: (stats.bookingsByStatus?.['completed'] ?? 0) as number, total: Math.max(stats.totalBookings as number ?? 1, 1), color: '#8b5cf6' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: 'rgba(99,102,241,.12)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.round((Number(row.value) / Number(row.total)) * 100))}%`, background: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending approvals */}
      <div className="card-glow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Pending Business Approvals</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Review and approve new business registrations</p>
          </div>
          {pendingBusinesses.length > 0 && (
            <span className="badge-glow text-xs">{pendingBusinesses.length} pending</span>
          )}
        </div>

        {pendingBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✅</div>
            <p style={{ color: 'var(--text-secondary)' }}>All caught up — no pending businesses</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Business</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Category</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Created</th>
                  <th className="text-right py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBusinesses.map((b) => (
                  <tr key={b._id} className="border-b table-row-hover transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{b.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4" style={{ color: 'var(--text-secondary)' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button size="sm" variant="primary" isLoading={actionLoading === b._id} onClick={() => handleVerify(b._id, true)}>Approve</Button>
                      <Button size="sm" variant="danger" isLoading={actionLoading === b._id} onClick={() => handleVerify(b._id, false)}>Reject</Button>
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
