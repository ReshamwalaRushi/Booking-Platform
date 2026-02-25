import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useBookings } from '../../hooks/useBookings';
import { Button } from '../../components/common/Button';
import { BookingStatus, Booking, Service, Business } from '../../types';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';

type TabType = 'upcoming' | 'past' | 'all';

const TABS: { label: string; value: TabType; emoji: string }[] = [
  { label: 'Upcoming', value: 'upcoming', emoji: '⏰' },
  { label: 'Past', value: 'past', emoji: '✅' },
  { label: 'All', value: 'all', emoji: '📋' },
];

function generateInvoiceHTML(booking: Booking): string {
  const service = booking.service as Service;
  const business = booking.business as Business;
  const startTime = new Date(booking.startTime);
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${booking._id}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #1e1b4b; }
          .header { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 4px 0 0; opacity: .8; font-size: 13px; }
          .body { background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          td:first-child { font-weight: 600; color: #6366f1; width: 40%; }
          .total { font-size: 18px; font-weight: bold; color: #6366f1; text-align: right; margin-top: 16px; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #d1fae5; color: #065f46; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📅 Booking Receipt</h1>
          <p>Invoice #${booking._id.slice(-8).toUpperCase()}</p>
        </div>
        <div class="body">
          <table>
            <tr><td>Business</td><td>${business?.name || 'N/A'}</td></tr>
            <tr><td>Service</td><td>${service?.name || 'N/A'}</td></tr>
            <tr><td>Date</td><td>${format(startTime, 'MMMM dd, yyyy')}</td></tr>
            <tr><td>Time</td><td>${format(startTime, 'h:mm a')}</td></tr>
            <tr><td>Duration</td><td>${service?.duration || 0} minutes</td></tr>
            <tr><td>Status</td><td><span class="status">${booking.status}</span></td></tr>
            <tr><td>Payment</td><td>${booking.paymentStatus}</td></tr>
          </table>
          <div class="total">Total: ${booking.currency} ${((booking.amount || 0) / 100).toFixed(2)}</div>
          <p style="font-size:12px;color:#6b7280;margin-top:24px;">Generated on ${new Date().toLocaleString()} • BookEase Platform</p>
        </div>
      </body>
    </html>
  `;
}

function downloadInvoice(booking: Booking) {
  const html = generateInvoiceHTML(booking);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${booking._id.slice(-8).toUpperCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BookingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const { bookings, isLoading, cancelBooking, refetch } = useBookings();
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
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
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{booking.currency} {((booking.amount || 0) / 100).toFixed(2)}</p>
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
                  {availableSlots.map((slot) => (
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
                      {format(new Date(slot), 'h:mm a')}
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
