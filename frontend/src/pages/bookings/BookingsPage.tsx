import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { Button } from '../../components/common/Button';
import { BookingStatus, PaymentStatus, Booking, Service, Business, Staff, UserRole } from '../../types';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: BookingStatus }) {
  const cls =
    status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-700' :
    status === BookingStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
    status === BookingStatus.CANCELLED ? 'bg-red-100 text-red-700' :
    status === BookingStatus.COMPLETED ? 'bg-blue-100 text-blue-700' :
    'bg-gray-100 text-gray-600';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>{status}</span>;
}

function PayBadge({ status }: { status: PaymentStatus }) {
  const cls =
    status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
    status === PaymentStatus.PENDING ? 'bg-orange-100 text-orange-700' :
    status === PaymentStatus.FAILED ? 'bg-red-100 text-red-700' :
    'bg-indigo-100 text-indigo-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>{status}</span>;
}

function downloadInvoice(booking: Booking) {
  const url = api.downloadBookingReceipt(booking._id);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${booking.bookingNumber || booking._id.slice(-8).toUpperCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ── Business Owner View ── */
function BusinessBookingsView() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [fromDate, setFromDate] = useState(() => format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [payConfirmModal, setPayConfirmModal] = useState<string | null>(null);
  const [confirmBookingModal, setConfirmBookingModal] = useState<string | null>(null);

  // Load business + staff
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
        status: statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setBookings(data);
      setPage(1);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, search, staffFilter, statusFilter, fromDate, toDate]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleConfirm = async (id: string) => {
    setConfirmBookingModal(null);
    setConfirmingId(id);
    try {
      const updated = await api.confirmBooking(id);
      setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
      toast.success('Booking confirmed!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm booking');
    } finally { setConfirmingId(null); }
  };

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

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    try {
      const updated = await api.completeBooking(id);
      setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
      toast.success('Booking completed!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete booking');
    } finally { setCompletingId(null); }
  };

  const clearFilters = () => {
    setSearch(''); setStaffFilter(''); setStatusFilter('');
    setFromDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    setToDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const paged = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Appointments</h1>
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
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')} className="input-field text-sm">
              <option value="">All statuses</option>
              {Object.values(BookingStatus).map((s) => (
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
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p style={{ color: 'var(--text-secondary)' }}>No appointments found</p>
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
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date & Time</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Amount</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Payment</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((booking) => {
                    const service = booking.service as Service;
                    const staff = booking.staff as Staff | undefined;
                    const client = typeof booking.client === 'object' ? booking.client : null;
                    const isPending = booking.status === BookingStatus.PENDING;
                    const isConfirmed = booking.status === BookingStatus.CONFIRMED;
                    const isPaid = booking.paymentStatus === PaymentStatus.PAID;
                    return (
                      <tr key={booking._id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono" style={{ color: '#6366f1' }}>{booking.bookingNumber || booking._id.slice(-8).toUpperCase()}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {client ? `${client.firstName} ${client.lastName}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{service?.name || '—'}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {staff ? `${(staff as Staff).firstName} ${(staff as Staff).lastName}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {format(new Date(booking.startTime), 'MMM dd, yyyy h:mm a')}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(booking.amount || 0)}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={booking.status} /></td>
                        <td className="px-4 py-3 text-center"><PayBadge status={booking.paymentStatus} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {isPending && (
                              <button
                                onClick={() => setConfirmBookingModal(booking._id)}
                                disabled={confirmingId === booking._id}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white disabled:opacity-50 whitespace-nowrap"
                                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                              >
                                {confirmingId === booking._id ? '…' : '✓ Confirm'}
                              </button>
                            )}
                            {isConfirmed && !isPaid && (
                              <button
                                onClick={() => setPayConfirmModal(booking._id)}
                                disabled={markingPaidId === booking._id}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white disabled:opacity-50 whitespace-nowrap"
                                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                              >
                                {markingPaidId === booking._id ? '…' : '💳 Payment Paid'}
                              </button>
                            )}
                            {isConfirmed && isPaid && (
                              <button
                                onClick={() => handleComplete(booking._id)}
                                disabled={completingId === booking._id}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white disabled:opacity-50 whitespace-nowrap"
                                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
                              >
                                {completingId === booking._id ? '…' : '✅ Complete'}
                              </button>
                            )}
                            <button
                              onClick={() => downloadInvoice(booking)}
                              className="text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                              style={{ background: 'rgba(99,102,241,.1)', color: 'var(--text-secondary)' }}
                            >
                              📄 Receipt
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

          {/* Pagination */}
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

      {/* Confirm Booking Modal */}
      {confirmBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmBookingModal(null)}>
          <div className="rounded-2xl p-6 w-80" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Confirm Booking?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>This will confirm the booking and notify the client.</p>
            <div className="flex gap-3">
              <button className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(107,114,128,.12)', color: 'var(--text-secondary)' }} onClick={() => setConfirmBookingModal(null)}>Cancel</button>
              <button className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }} onClick={() => handleConfirm(confirmBookingModal)}>Confirm</button>
            </div>
          </div>
        </div>
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
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-left capitalize transition-all hover:opacity-90"
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

/* ── Client View ── */
const DEFAULT_FROM = format(subDays(new Date(), 7), 'yyyy-MM-dd');
const DEFAULT_TO = format(new Date(), 'yyyy-MM-dd');

function ClientBookingsView() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [fromDate, setFromDate] = useState(DEFAULT_FROM);
  const [toDate, setToDate] = useState(DEFAULT_TO);
  const [page, setPage] = useState(1);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; availableStaff: number }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getBookings({
        search: search || undefined,
        status: statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setBookings(data);
      setPage(1);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, fromDate, toDate]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const clearFilters = () => {
    setSearch(''); setStatusFilter('');
    setFromDate(DEFAULT_FROM);
    setToDate(DEFAULT_TO);
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await api.cancelBooking(id);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleRescheduleOpen = (booking: Booking) => {
    setRescheduleBooking(booking);
    setRescheduleDate('');
    setRescheduleSlot('');
    setAvailableSlots([]);
  };

  const handleDateChange = async (date: string) => {
    setRescheduleDate(date);
    setRescheduleSlot('');
    if (!rescheduleBooking || !date) return;
    const service = rescheduleBooking.service as Service;
    const business = rescheduleBooking.business as Business;
    setIsLoadingSlots(true);
    try {
      const slots = await api.getAvailableSlots(business._id, service._id, date);
      setAvailableSlots(slots);
    } catch {
      setAvailableSlots([]);
    } finally { setIsLoadingSlots(false); }
  };

  const handleReschedule = async () => {
    if (!rescheduleBooking || !rescheduleSlot) return;
    setIsRescheduling(true);
    try {
      await api.rescheduleBooking(rescheduleBooking._id, rescheduleSlot);
      toast.success('Booking rescheduled!');
      setRescheduleBooking(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reschedule');
    } finally { setIsRescheduling(false); }
  };

  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const maxDate = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const paged = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Appointments</h1>
        <Link to="/bookings/new">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-5 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Search (booking #)</label>
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')} className="input-field text-sm">
              <option value="">All statuses</option>
              {Object.values(BookingStatus).map((s) => (
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
        {(search || statusFilter || fromDate !== DEFAULT_FROM || toDate !== DEFAULT_TO) && (
          <button onClick={clearFilters} className="mt-2 text-sm" style={{ color: '#6366f1' }}>Reset Filters</button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p style={{ color: 'var(--text-secondary)' }}>No appointments found</p>
          <Link to="/bookings/new" className="inline-block mt-4">
            <Button size="sm">Book Now</Button>
          </Link>
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
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date & Time</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Amount</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((booking) => {
                    const service = booking.service as Service;
                    const business = booking.business as Business;
                    const canAct = [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status) && new Date(booking.startTime) > now;
                    return (
                      <tr key={booking._id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono" style={{ color: '#6366f1' }}>{booking.bookingNumber || booking._id.slice(-8).toUpperCase()}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{service?.name || '—'}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{business?.name || '—'}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {format(new Date(booking.startTime), 'MMM dd, yyyy h:mm a')}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(booking.amount || 0)}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={booking.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => downloadInvoice(booking)}
                              className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
                              style={{ background: 'rgba(99,102,241,.1)', color: 'var(--text-secondary)' }}
                            >
                              📄 Receipt
                            </button>
                            {canAct && (
                              <button
                                onClick={() => handleRescheduleOpen(booking)}
                                className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
                                style={{ background: 'rgba(16,185,129,.1)', color: '#059669' }}
                              >
                                🗓 Reschedule
                              </button>
                            )}
                            {canAct && (
                              <button
                                onClick={() => handleCancelBooking(booking._id)}
                                className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
                                style={{ background: 'rgba(239,68,68,.1)', color: '#dc2626' }}
                              >
                                ✕ Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
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

      {/* Reschedule Modal */}
      <Modal isOpen={!!rescheduleBooking} onClose={() => setRescheduleBooking(null)} title="Reschedule Appointment" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Select New Date</label>
            <input type="date" value={rescheduleDate} onChange={(e) => handleDateChange(e.target.value)} min={today} max={maxDate} className="input-field" />
          </div>
          {rescheduleDate && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Select Time Slot</label>
              {isLoadingSlots ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading slots...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No available slots for this date</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map(({ slot, availableStaff }) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setRescheduleSlot(slot)}
                      className={`py-2 px-3 text-sm rounded-lg border transition-all ${rescheduleSlot === slot ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}
                      style={rescheduleSlot !== slot ? { background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border)' } : {}}
                    >
                      <div>{format(new Date(slot), 'h:mm a')}</div>
                      {availableStaff > 0 && (
                        <div className={`text-xs mt-0.5 ${rescheduleSlot === slot ? 'text-white/80' : 'text-green-600'}`}>{availableStaff} avail</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setRescheduleBooking(null)}>Cancel</Button>
            <Button onClick={handleReschedule} isLoading={isRescheduling} disabled={!rescheduleSlot}>Confirm Reschedule</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function BookingsPage() {
  const { user } = useAuth();
  if (user?.role === UserRole.BUSINESS_OWNER) return <BusinessBookingsView />;
  return <ClientBookingsView />;
}
