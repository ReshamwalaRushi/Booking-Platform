import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Booking, Business, BookingStatus, PaymentStatus } from '../../types';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const quickActions = [
  { to: '/business/services', emoji: '🛎️', label: 'Manage Services', desc: 'Add or edit services', color: '#8b5cf6' },
  { to: '/business/staff', emoji: '👤', label: 'Manage Staff', desc: 'View your team', color: '#06b6d4' },
  { to: '/calendar', emoji: '📆', label: 'View Calendar', desc: 'See your schedule', color: '#10b981' },
  { to: '/bookings', emoji: '📋', label: 'All Bookings', desc: 'Manage bookings', color: '#6366f1' },
];

export function BusinessDashboardPage() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [paymentMethodModal, setPaymentMethodModal] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const biz = await api.getMyBusinesses();
        setBusinesses(biz);
        if (biz.length > 0) {
          const allBookings = await api.getBusinessBookings(biz[0]._id);
          setBookings(allBookings);
        }
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleComplete = async (bookingId: string) => {
    setCompletingId(bookingId);
    try {
      const updated = await api.completeBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)));
      toast.success('Appointment marked as completed!');
    } catch {
      toast.error('Failed to complete appointment');
    } finally {
      setCompletingId(null);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    setConfirmingId(bookingId);
    try {
      const updated = await api.confirmBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)));
      toast.success('Booking confirmed!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm booking');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleMarkAsPaid = async (bookingId: string, paymentMethod: string) => {
    setMarkingPaidId(bookingId);
    setPaymentMethodModal(null);
    try {
      const updated = await api.markBookingAsPaid(bookingId, paymentMethod);
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)));
      toast.success('Payment recorded!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setMarkingPaidId(null);
    }
  };

  const currentDateTime = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayBookings = bookings.filter((b) => {
    const d = new Date(b.startTime);
    return d >= today && d < tomorrow;
  });

  const pastConfirmedBookings = bookings.filter((b) => {
    return b.status === BookingStatus.CONFIRMED && new Date(b.endTime) < currentDateTime;
  });

  const totalRevenue = bookings
    .filter((b) => b.status === BookingStatus.COMPLETED)
    .reduce((sum, b) => sum + b.amount, 0);

  const statCards = [
    { label: "Today's Appointments", value: todayBookings.length, cardClass: 'stat-card-purple', icon: '📅' },
    { label: 'Total Bookings', value: bookings.length, cardClass: 'stat-card-blue', icon: '📋' },
    { label: 'Completed', value: bookings.filter((b) => b.status === BookingStatus.COMPLETED).length, cardClass: 'stat-card-green', icon: '✅' },
    { label: 'Revenue', value: formatCurrency(totalRevenue), cardClass: 'stat-card-orange', icon: '💰' },
  ];

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <span className="badge-glow text-xs">Business Dashboard</span>
          <h1 className="text-3xl font-bold text-white mt-3">
            Welcome back, <span className="gradient-text">{user?.firstName}</span>! 👋
          </h1>
          <p className="text-slate-400 mt-1">
            {businesses.length > 0 ? businesses[0].name : 'Your business dashboard'}
          </p>
        </div>
        <Link to="/business/profile">
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.cardClass} relative overflow-hidden`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-4xl font-extrabold mb-1 tracking-tight">{String(s.value)}</div>
            <div className="text-sm font-medium opacity-80">{s.label}</div>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10" />
          </div>
        ))}
      </div>

      {/* Appointments Management */}
      <div className="card-glow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">All Bookings</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by booking #, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg border"
              style={{ background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.15)', color: 'white', width: 220 }}
            />
          </div>
        </div>
        {bookings.filter((b) => {
          if (!search) return true;
          const s = search.toLowerCase();
          const client = typeof b.client === 'object' ? `${b.client.firstName} ${b.client.lastName}`.toLowerCase() : '';
          const bn = (b.bookingNumber || '').toLowerCase();
          return client.includes(s) || bn.includes(s);
        }).length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No bookings found</p>
        ) : (
          <ul className="divide-y divide-white/8">
            {bookings.filter((b) => {
              if (!search) return true;
              const s = search.toLowerCase();
              const client = typeof b.client === 'object' ? `${b.client.firstName} ${b.client.lastName}`.toLowerCase() : '';
              const bn = (b.bookingNumber || '').toLowerCase();
              return client.includes(s) || bn.includes(s);
            }).slice(0, 10).map((b) => (
              <li key={b._id} className="py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">
                        {typeof b.client === 'object' ? `${b.client.firstName} ${b.client.lastName}` : 'Client'}
                      </p>
                      {b.bookingNumber && (
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,.2)', color: '#a5b4fc' }}>
                          {b.bookingNumber}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        b.status === BookingStatus.CONFIRMED ? 'bg-emerald-500/15 text-emerald-400' :
                        b.status === BookingStatus.PENDING ? 'bg-amber-500/15 text-amber-400' :
                        b.status === BookingStatus.COMPLETED ? 'bg-blue-500/15 text-blue-400' :
                        'bg-red-500/15 text-red-400'
                      }`}>{b.status}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        b.paymentStatus === PaymentStatus.PAID ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'
                      }`}>{b.paymentStatus}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(b.startTime).toLocaleDateString('en-IN')} · {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {formatCurrency(b.amount || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {b.status === BookingStatus.PENDING && (
                      <button
                        onClick={() => handleConfirm(b._id)}
                        disabled={confirmingId === b._id}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg text-white disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                      >
                        {confirmingId === b._id ? '…' : '✓ Confirm'}
                      </button>
                    )}
                    {b.paymentStatus !== PaymentStatus.PAID && (
                      <button
                        onClick={() => setPaymentMethodModal(b._id)}
                        disabled={markingPaidId === b._id}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg text-white disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                      >
                        {markingPaidId === b._id ? '…' : '💳 Mark Paid'}
                      </button>
                    )}
                    {b.status === BookingStatus.CONFIRMED && new Date(b.endTime) < new Date() && (
                      <button
                        onClick={() => handleComplete(b._id)}
                        disabled={completingId === b._id}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg text-white disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                      >
                        {completingId === b._id ? '…' : '✅ Complete'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Today's appointments */}
        <div className="card-glow">
          <h2 className="text-lg font-bold text-white mb-4">Today's Appointments</h2>
          {todayBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🗓️</div>
              <p className="text-slate-400 text-sm">No appointments today — enjoy your day!</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/8">
              {todayBookings.slice(0, 5).map((b) => (
                <li key={b._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {typeof b.client === 'object' ? `${b.client.firstName} ${b.client.lastName}` : 'Client'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {b.bookingNumber && <span className="font-mono mr-1">{b.bookingNumber} ·</span>}
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.status === BookingStatus.PENDING && (
                      <button
                        onClick={() => handleConfirm(b._id)}
                        disabled={confirmingId === b._id}
                        className="text-xs px-2 py-1 rounded-lg font-semibold text-white"
                        style={{ background: 'rgba(99,102,241,.5)' }}
                      >
                        Confirm
                      </button>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      b.status === BookingStatus.CONFIRMED
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to}>
                <div
                  className="card-modern cursor-pointer h-full group"
                  style={{ borderColor: `${action.color}25` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${action.color}20` }}
                  >
                    {action.emoji}
                  </div>
                  <p className="font-semibold text-white text-sm">{action.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Awaiting completion */}
      {pastConfirmedBookings.length > 0 && (
        <div className="card-glow">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-bold text-white">Awaiting Completion</h2>
            <span className="badge-glow text-xs">{pastConfirmedBookings.length}</span>
          </div>
          <p className="text-sm text-slate-400 mb-5">These appointments have passed — mark them complete to update revenue stats.</p>
          <ul className="divide-y divide-white/8">
            {pastConfirmedBookings.map((b) => (
              <li key={b._id} className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {typeof b.client === 'object' ? `${b.client.firstName} ${b.client.lastName}` : 'Client'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(b.startTime).toLocaleDateString('en-IN')} · {typeof b.service === 'object' ? b.service.name : 'Service'} · {formatCurrency(b.amount || 0)}
                  </p>
                </div>
                <button
                  onClick={() => handleComplete(b._id)}
                  disabled={completingId === b._id}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl text-white disabled:opacity-50 transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,.3)' }}
                >
                  {completingId === b._id ? 'Saving…' : '✅ Mark Complete'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Payment Method Modal */}
      {paymentMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPaymentMethodModal(null)}>
          <div className="rounded-2xl p-6 w-80" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Select Payment Method</h3>
            <div className="space-y-2">
              {['cash', 'card', 'upi', 'online'].map((method) => (
                <button
                  key={method}
                  onClick={() => handleMarkAsPaid(paymentMethodModal, method)}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-left capitalize transition-all hover:opacity-90"
                  style={{ background: 'rgba(99,102,241,.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,.3)' }}
                >
                  {method === 'upi' ? 'UPI' : method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>
            <button className="mt-3 w-full py-2 text-sm text-slate-400" onClick={() => setPaymentMethodModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
