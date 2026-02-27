import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useBookings } from '../../hooks/useBookings';
import { Button } from '../../components/common/Button';
import { BookingStatus, PaymentStatus, Booking, Service, Business, Staff, UserRole } from '../../types';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

type TabType = 'upcoming' | 'past' | 'all';

const TABS: { label: string; value: TabType; emoji: string }[] = [
  { label: 'Upcoming', value: 'upcoming', emoji: '⏰' },
  { label: 'Past', value: 'past', emoji: '✅' },
  { label: 'All', value: 'all', emoji: '📋' },
];

function downloadInvoice(booking: Booking) {
  // Use the backend PDF endpoint
  const url = api.downloadBookingReceipt(booking._id);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${booking.bookingNumber || booking._id.slice(-8).toUpperCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ─── Business Owner Bookings View ─── */
function BusinessBookingsView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [payConfirmModal, setPayConfirmModal] = useState<{ id: string; method: string } | null>(null);
  const [confirmBookingModal, setConfirmBookingModal] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const biz = await api.getMyBusinesses();
        if (biz.length > 0) {
          const data = await api.getBusinessBookings(biz[0]._id);
          setBookings(data);
        }
      } catch {
        toast.error('Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleConfirm = async (id: string) => {
    setConfirmBookingModal(null);
    setConfirmingId(id);
    try {
      const updated = await api.confirmBooking(id);
      setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
      toast.success('Booking confirmed!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm booking');
    } finally {
      setConfirmingId(null);
    }
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
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    try {
      const updated = await api.completeBooking(id);
      setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
      toast.success('Booking completed!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete booking');
    } finally {
      setCompletingId(null);
    }
  };

  const filtered = bookings.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (dateFilter) {
      const bookingDate = format(new Date(b.startTime), 'yyyy-MM-dd');
      if (bookingDate !== dateFilter) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      const clientName = typeof b.client === 'object' ? `${b.client.firstName} ${b.client.lastName}`.toLowerCase() : '';
      const bn = (b.bookingNumber || '').toLowerCase();
      const svcName = typeof b.service === 'object' ? (b.service as Service).name.toLowerCase() : '';
      if (!clientName.includes(s) && !bn.includes(s) && !svcName.includes(s)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Appointments</h1>
      </div>

      {/* Filters */}
      <div className="card mb-5 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Search (booking #, client, service)</label>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Filter by Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
              className="input-field text-sm"
            >
              <option value="">All statuses</option>
              {Object.values(BookingStatus).map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
        </div>
        {(search || dateFilter || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setDateFilter(''); setStatusFilter(''); }}
            className="mt-2 text-sm"
            style={{ color: '#6366f1' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p style={{ color: 'var(--text-secondary)' }}>No appointments found</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {filtered.map((booking) => {
            const service = booking.service as Service;
            const staff = booking.staff as Staff | undefined;
            const client = typeof booking.client === 'object' ? booking.client : null;
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            const canConfirm = booking.status === BookingStatus.PENDING;
            const canComplete = booking.status === BookingStatus.CONFIRMED && endTime < new Date();
            const canMarkPaid = booking.paymentStatus !== PaymentStatus.PAID;

            return (
              <div key={booking._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {booking.bookingNumber && (
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,.1)', color: '#6366f1' }}>
                          {booking.bookingNumber}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        booking.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-700' :
                        booking.status === BookingStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === BookingStatus.CANCELLED ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{booking.status}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        booking.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      }`}>{booking.paymentStatus}</span>
                    </div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {client ? `${client.firstName} ${client.lastName}` : 'Client'}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{service?.name || 'Service'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Date & Time</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {format(startTime, 'MMM dd, yyyy')} · {format(startTime, 'h:mm a')}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Amount</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(booking.amount || 0)}</p>
                  </div>
                  {staff && (
                    <div>
                      <p style={{ color: 'var(--text-muted)' }}>Staff Assigned</p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {(staff as Staff).firstName} {(staff as Staff).lastName}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  {canConfirm && (
                    <button
                      onClick={() => setConfirmBookingModal(booking._id)}
                      disabled={confirmingId === booking._id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                    >
                      {confirmingId === booking._id ? '…' : '✓ Confirm'}
                    </button>
                  )}
                  {canMarkPaid && (
                    <button
                      onClick={() => setPayConfirmModal({ id: booking._id, method: 'cash' })}
                      disabled={markingPaidId === booking._id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                    >
                      {markingPaidId === booking._id ? '…' : '💳 Mark Paid'}
                    </button>
                  )}
                  {canComplete && (
                    <button
                      onClick={() => handleComplete(booking._id)}
                      disabled={completingId === booking._id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}
                    >
                      {completingId === booking._id ? '…' : '✅ Complete'}
                    </button>
                  )}
                  <button
                    onClick={() => downloadInvoice(booking)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(99,102,241,.1)', color: 'var(--text-secondary)' }}
                  >
                    📄 Receipt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Booking Confirmation Modal */}
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

      {/* Pay Confirmation Modal */}
      {payConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPayConfirmModal(null)}>
          <div className="rounded-2xl p-6 w-80" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Select Payment Method</h3>
            <div className="space-y-2 mb-3">
              {['cash', 'card', 'upi', 'online'].map((method) => (
                <button
                  key={method}
                  onClick={() => handleMarkAsPaid(payConfirmModal.id, method)}
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

export function BookingsPage() {
  const { user } = useAuth();

  // Business owners see their business appointments
  if (user?.role === UserRole.BUSINESS_OWNER) {
    return <BusinessBookingsView />;
  }

  return <ClientBookingsView />;
}

function ClientBookingsView() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const { bookings, isLoading, cancelBooking, refetch } = useBookings();
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; availableStaff: number }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const now = new Date();

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'upcoming') {
      return [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(b.status) && new Date(b.startTime) > now;
    }
    if (activeTab === 'past') {
      return b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CANCELLED || new Date(b.endTime) < now;
    }
    return true;
  });

  const handleRescheduleOpen = async (booking: Booking) => {
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
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBooking || !rescheduleSlot) return;
    setIsRescheduling(true);
    try {
      await api.rescheduleBooking(rescheduleBooking._id, rescheduleSlot);
      toast.success('Booking rescheduled successfully!');
      setRescheduleBooking(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reschedule booking');
    } finally {
      setIsRescheduling(false);
    }
  };

  const today = format(now, 'yyyy-MM-dd');
  const maxDate = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(({ label, value, emoji }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-400'
            }`}
            style={activeTab !== value ? { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
          >
            <span>{emoji}</span>
            {label}
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}
              style={activeTab !== value ? { background: 'rgba(99,102,241,.12)', color: 'var(--text-muted)' } : {}}
            >
              {bookings.filter((b) => {
                if (value === 'upcoming') return [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(b.status) && new Date(b.startTime) > now;
                if (value === 'past') return b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CANCELLED || new Date(b.endTime) < now;
                return true;
              }).length}
            </span>
          </button>
        ))}
      </div>

      {/* Booking list with extra actions */}
      {isLoading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p style={{ color: 'var(--text-secondary)' }}>No {activeTab} appointments found</p>
          {activeTab === 'upcoming' && (
            <Link to="/bookings/new" className="inline-block mt-4">
              <Button size="sm">Book Now</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {filteredBookings.map((booking) => {
            const service = booking.service as Service;
            const business = booking.business as Business;
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            const canCancel = [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status) && new Date(booking.startTime) > now;
            const canReschedule = canCancel;

            return (
              <div key={booking._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{service?.name || 'Service'}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        booking.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-700' :
                        booking.status === BookingStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === BookingStatus.CANCELLED ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {booking.status}
                      </span>
                      {booking.bookingNumber && (
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,.1)', color: '#6366f1' }}>
                          {booking.bookingNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{business?.name || 'Business'}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p style={{ color: 'var(--text-muted)' }}>Date</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{format(startTime, 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-muted)' }}>Time</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{format(startTime, 'h:mm a')} – {format(endTime, 'h:mm a')}</p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-muted)' }}>Duration</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{service?.duration || 0} min</p>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-muted)' }}>Amount</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(booking.amount || 0)}</p>
                      </div>
                    </div>
                    {booking.notes && (
                      <p className="mt-2 text-sm italic" style={{ color: 'var(--text-secondary)' }}>Note: {booking.notes}</p>
                    )}
                    {booking.zoomJoinUrl && (
                      <a
                        href={booking.zoomJoinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 10l4-2v8l-4-2v-4zm-1 7H3a1 1 0 01-1-1V8a1 1 0 011-1h13a1 1 0 011 1v8a1 1 0 01-1 1z" />
                        </svg>
                        Join Video Call
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => downloadInvoice(booking)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(99,102,241,.1)', color: 'var(--text-secondary)' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Receipt
                  </button>
                  {canReschedule && (
                    <button
                      onClick={() => handleRescheduleOpen(booking)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'rgba(16,185,129,.1)', color: '#059669' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Reschedule
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => cancelBooking(booking._id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'rgba(239,68,68,.1)', color: '#dc2626' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleBooking}
        onClose={() => setRescheduleBooking(null)}
        title="Reschedule Appointment"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Select New Date</label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={today}
              max={maxDate}
              className="input-field"
            />
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
                      className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                        rescheduleSlot === slot
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                      }`}
                      style={rescheduleSlot !== slot ? { background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border)' } : {}}
                    >
                      <div>{format(new Date(slot), 'h:mm a')}</div>
                      {availableStaff > 0 && (
                        <div className={`text-xs mt-0.5 ${rescheduleSlot === slot ? 'text-white/80' : 'text-green-600'}`}>
                          {availableStaff} avail
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setRescheduleBooking(null)}>Cancel</Button>
            <Button onClick={handleReschedule} isLoading={isRescheduling} disabled={!rescheduleSlot}>
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
