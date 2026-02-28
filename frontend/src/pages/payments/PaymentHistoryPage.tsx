import React, { useEffect, useState, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { Booking, PaymentStatus, Service, Business, Staff, UserRole } from '../../types';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_SIZE = 10;

function paymentStatusColor(status: PaymentStatus): { bg: string; text: string } {
  switch (status) {
    case PaymentStatus.PAID: return { bg: 'rgba(16,185,129,.12)', text: '#059669' };
    case PaymentStatus.PENDING: return { bg: 'rgba(245,158,11,.12)', text: '#d97706' };
    case PaymentStatus.REFUNDED: return { bg: 'rgba(99,102,241,.12)', text: '#6366f1' };
    case PaymentStatus.FAILED: return { bg: 'rgba(239,68,68,.12)', text: '#dc2626' };
    default: return { bg: 'rgba(107,114,128,.12)', text: '#6b7280' };
  }
}

/* ── Business Owner Payment History ── */
function BusinessPaymentHistory() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [fromDate, setFromDate] = useState(() => format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [payConfirmModal, setPayConfirmModal] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const biz = await api.getMyBusinesses();
        if (biz.length > 0) {
          setBusinessId(biz[0]._id);
          const staff = await api.getStaff(biz[0]._id);
          setStaffList(staff.filter((s) => s.isActive));
        }
      } catch {
        toast.error('Failed to load business data');
      }
    })();
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!businessId) return;
    setIsLoading(true);
    try {
      const data = await api.getBusinessBookings(businessId, {
        search: search || undefined,
        staffId: staffFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      // Filter by payment status if needed
      const filtered = statusFilter ? data.filter((b) => b.paymentStatus === statusFilter) : data;
      setBookings(filtered);
      setPage(1);
    } catch {
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, search, staffFilter, statusFilter, fromDate, toDate]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleMarkAsPaid = async (id: string, method: string) => {
    setPayConfirmModal(null);
    setMarkingPaidId(id);
    try {
      const updated = await api.markBookingAsPaid(id, method);
      setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
      toast.success('Payment recorded!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark as paid');
    } finally { setMarkingPaidId(null); }
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

  const clearFilters = () => {
    setSearch(''); setStaffFilter(''); setStatusFilter('');
    setFromDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    setToDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const totalPaid = bookings.filter((b) => b.paymentStatus === PaymentStatus.PAID).reduce((s, b) => s + (b.amount || 0), 0);
  const totalPending = bookings.filter((b) => b.paymentStatus === PaymentStatus.PENDING).reduce((s, b) => s + (b.amount || 0), 0);
  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const paged = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Payment History</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Track all client payments for your business</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Transactions</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{bookings.length}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Collected</p>
          <p className="text-3xl font-bold" style={{ color: '#059669' }}>{formatCurrency(totalPaid)}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Pending Amount</p>
          <p className="text-3xl font-bold" style={{ color: '#d97706' }}>{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-5 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Search (booking #, client)</label>
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Staff</label>
            <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="input-field text-sm">
              <option value="">All staff</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Payment Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | '')} className="input-field text-sm">
              <option value="">All statuses</option>
              {Object.values(PaymentStatus).map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-field text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={clearFilters} className="text-sm px-4 py-2 rounded-lg w-full" style={{ background: 'rgba(99,102,241,.1)', color: '#6366f1' }}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">💳</div>
          <p style={{ color: 'var(--text-secondary)' }}>No transactions found</p>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(99,102,241,.04)' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Booking #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Service</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Staff</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Amount</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((booking) => {
                    const service = booking.service as Service;
                    const staff = booking.staff as Staff | undefined;
                    const client = typeof booking.client === 'object' ? booking.client : null;
                    const { bg, text } = paymentStatusColor(booking.paymentStatus);
                    return (
                      <tr key={booking._id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono" style={{ color: '#6366f1' }}>{booking.bookingNumber || booking._id.slice(-8).toUpperCase()}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {client ? `${client.firstName} ${client.lastName}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {service?.name || '—'}
                          {booking.paymentMethod && (
                            <span className="ml-2 text-xs capitalize" style={{ color: 'var(--text-muted)' }}>via {booking.paymentMethod}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {staff ? `${(staff as Staff).firstName} ${(staff as Staff).lastName}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right" style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(booking.amount || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: bg, color: text }}>{booking.paymentStatus}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {booking.paymentStatus !== PaymentStatus.PAID && (
                              <button
                                onClick={() => setPayConfirmModal(booking._id)}
                                disabled={markingPaidId === booking._id}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                                style={{ background: 'rgba(16,185,129,.12)', color: '#059669' }}
                              >
                                {markingPaidId === booking._id ? '…' : '✓ Mark Paid'}
                              </button>
                            )}
                            <button
                              onClick={() => downloadReceipt(booking)}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg"
                              style={{ background: 'rgba(99,102,241,.1)', color: 'var(--text-secondary)' }}
                              title="Download PDF Receipt"
                            >
                              📄 PDF
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, bookings.length)} of {bookings.length}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>← Prev</button>
                <span className="px-3 py-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment Confirmation Modal */}
      {payConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPayConfirmModal(null)}>
          <div className="rounded-2xl p-6 w-80" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Record Payment</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Select payment method to confirm payment received.</p>
            <div className="space-y-2 mb-3">
              {['cash', 'card', 'upi', 'online'].map((method) => (
                <button
                  key={method}
                  onClick={() => handleMarkAsPaid(payConfirmModal, method)}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-left capitalize"
                  style={{ background: 'rgba(16,185,129,.12)', color: '#059669', border: '1px solid rgba(16,185,129,.25)' }}
                >
                  {method === 'upi' ? 'UPI' : method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>
            <button className="w-full py-2 text-sm" style={{ color: 'var(--text-muted)' }} onClick={() => setPayConfirmModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Client Payment History ── */
function ClientPaymentHistory() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState(() => format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getBookings({
        search: search || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      const filtered = statusFilter ? data.filter((b) => b.paymentStatus === statusFilter) : data;
      setBookings(filtered);
      setPage(1);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, fromDate, toDate]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const downloadReceipt = (booking: Booking) => {
    const url = api.downloadBookingReceipt(booking._id);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${booking.bookingNumber || booking._id.slice(-8).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clearFilters = () => {
    setSearch(''); setStatusFilter('');
    setFromDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    setToDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const totalPaid = bookings.filter((b) => b.paymentStatus === PaymentStatus.PAID).reduce((s, b) => s + (b.amount || 0), 0);
  const totalPending = bookings.filter((b) => b.paymentStatus === PaymentStatus.PENDING).reduce((s, b) => s + (b.amount || 0), 0);
  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const paged = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{bookings.length}</p>
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

      {/* Filters */}
      <div className="card mb-5 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Search (booking #)</label>
            <input type="text" placeholder="BK-..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Payment Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | '')} className="input-field text-sm">
              <option value="">All statuses</option>
              {Object.values(PaymentStatus).map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-field text-sm" />
          </div>
        </div>
        <button onClick={clearFilters} className="mt-2 text-sm" style={{ color: '#6366f1' }}>Reset Filters</button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">💳</div>
          <p style={{ color: 'var(--text-secondary)' }}>No transactions found</p>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(99,102,241,.04)' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Booking #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Service</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Business</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Amount</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((booking) => {
                    const service = booking.service as Service;
                    const business = booking.business as Business;
                    const { bg, text } = paymentStatusColor(booking.paymentStatus);
                    return (
                      <tr key={booking._id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono" style={{ color: '#6366f1' }}>{booking.bookingNumber || booking._id.slice(-8).toUpperCase()}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {service?.name || '—'}
                          {booking.paymentMethod && (
                            <span className="ml-2 text-xs capitalize" style={{ color: 'var(--text-muted)' }}>via {booking.paymentMethod}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{business?.name || '—'}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right" style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(booking.amount || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: bg, color: text }}>{booking.paymentStatus}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => downloadReceipt(booking)}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg"
                            style={{ background: 'rgba(99,102,241,.1)', color: 'var(--text-secondary)' }}
                            title="Download PDF Receipt"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, bookings.length)} of {bookings.length}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>← Prev</button>
                <span className="px-3 py-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function PaymentHistoryPage() {
  const { user } = useAuth();
  if (user?.role === UserRole.BUSINESS_OWNER) return <BusinessPaymentHistory />;
  return <ClientPaymentHistory />;
}
