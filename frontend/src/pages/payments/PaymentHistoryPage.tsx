import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Booking, PaymentStatus, Service, Business } from '../../types';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

type PaymentFilter = 'all' | PaymentStatus;

const PAYMENT_FILTERS: { label: string; value: PaymentFilter; emoji: string }[] = [
  { label: 'All', value: 'all', emoji: '📋' },
  { label: 'Paid', value: PaymentStatus.PAID, emoji: '✅' },
  { label: 'Pending', value: PaymentStatus.PENDING, emoji: '⏳' },
  { label: 'Refunded', value: PaymentStatus.REFUNDED, emoji: '↩️' },
  { label: 'Failed', value: PaymentStatus.FAILED, emoji: '❌' },
];

function paymentStatusColor(status: PaymentStatus): { bg: string; text: string } {
  switch (status) {
    case PaymentStatus.PAID: return { bg: 'rgba(16,185,129,.12)', text: '#059669' };
    case PaymentStatus.PENDING: return { bg: 'rgba(245,158,11,.12)', text: '#d97706' };
    case PaymentStatus.REFUNDED: return { bg: 'rgba(99,102,241,.12)', text: '#6366f1' };
    case PaymentStatus.FAILED: return { bg: 'rgba(239,68,68,.12)', text: '#dc2626' };
    default: return { bg: 'rgba(107,114,128,.12)', text: '#6b7280' };
  }
}

export function PaymentHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentFilter>('all');
  const [search, setSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  useEffect(() => {
    api.getBookings().then((data) => {
      setBookings(data);
    }).catch(() => {
      setBookings([]);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const handleMarkAsPaid = async (bookingId: string) => {
    setMarkingPaidId(bookingId);
    try {
      const updated = await api.markBookingAsPaid(bookingId, 'cash');
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)));
      toast.success('Payment recorded!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setMarkingPaidId(null);
    }
  };

  const downloadReceipt = (booking: Booking) => {
    const url = api.downloadBookingReceipt(booking._id);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${booking.bookingNumber || booking._id.slice(-8).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filtered = bookings.filter((b) => {
    if (filter !== 'all' && b.paymentStatus !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      const bn = (b.bookingNumber || '').toLowerCase();
      const svc = typeof b.service === 'object' ? (b.service as Service).name.toLowerCase() : '';
      const biz = typeof b.business === 'object' ? (b.business as Business).name.toLowerCase() : '';
      if (!bn.includes(s) && !svc.includes(s) && !biz.includes(s)) return false;
    }
    if (paymentMethodFilter && b.paymentMethod !== paymentMethodFilter) return false;
    if (dateFrom && new Date(b.startTime) < new Date(dateFrom)) return false;
    if (dateTo && new Date(b.startTime) > new Date(dateTo + 'T23:59:59')) return false;
    if (amountMin && (b.amount || 0) < parseFloat(amountMin) * 100) return false;
    if (amountMax && (b.amount || 0) > parseFloat(amountMax) * 100) return false;
    return true;
  });

  const totalPaid = filtered
    .filter((b) => b.paymentStatus === PaymentStatus.PAID)
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const totalPending = filtered
    .filter((b) => b.paymentStatus === PaymentStatus.PENDING)
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Payment History</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Track your transactions and download receipts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Transactions</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{filtered.length}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Paid</p>
          <p className="text-3xl font-bold" style={{ color: '#059669' }}>{formatCurrency(totalPaid)}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Pending Amount</p>
          <p className="text-3xl font-bold" style={{ color: '#d97706' }}>{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {PAYMENT_FILTERS.map(({ label, value, emoji }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              filter === value ? 'bg-indigo-600 text-white shadow-sm' : ''
            }`}
            style={filter !== value ? { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' } : {}}
          >
            <span>{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="card mb-5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Advanced Filters</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Search (booking #, service)</label>
            <input
              type="text"
              placeholder="BK-20241201-..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">All methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Min Amount (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Max Amount (₹)</label>
            <input
              type="number"
              placeholder="Any"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setSearch(''); setPaymentMethodFilter(''); setDateFrom(''); setDateTo(''); setAmountMin(''); setAmountMax(''); }}
              className="text-sm px-4 py-2 rounded-lg w-full"
              style={{ background: 'rgba(99,102,241,.1)', color: '#6366f1' }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">💳</div>
          <p style={{ color: 'var(--text-secondary)' }}>No transactions found</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(99,102,241,.04)' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Booking #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Service</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Amount</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => {
                  const service = booking.service as Service;
                  const { bg, text } = paymentStatusColor(booking.paymentStatus);
                  return (
                    <tr
                      key={booking._id}
                      className="table-row-hover"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono" style={{ color: '#6366f1' }}>
                          {booking.bookingNumber || booking._id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {service?.name || 'Service'}
                        {booking.paymentMethod && (
                          <span className="ml-2 text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                            via {booking.paymentMethod}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(booking.amount || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: bg, color: text }}
                        >
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {booking.paymentStatus !== PaymentStatus.PAID && (
                            <button
                              onClick={() => handleMarkAsPaid(booking._id)}
                              disabled={markingPaidId === booking._id}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              style={{ background: 'rgba(16,185,129,.12)', color: '#059669' }}
                            >
                              {markingPaidId === booking._id ? '…' : '✓ Mark Paid'}
                            </button>
                          )}
                          <button
                            onClick={() => downloadReceipt(booking)}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'rgba(99,102,241,.1)', color: 'var(--text-secondary)' }}
                            title="Download PDF Receipt"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
