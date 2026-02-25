import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Booking, PaymentStatus, Service, Business } from '../../types';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

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

function generateReceiptHTML(booking: Booking): string {
  const service = booking.service as Service;
  const business = booking.business as Business;
  const startTime = new Date(booking.startTime);
  const { bg, text } = paymentStatusColor(booking.paymentStatus);
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${booking._id}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #1e1b4b; }
          .header { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0 0 4px; font-size: 22px; }
          .header p { margin: 0; opacity: .8; font-size: 13px; }
          .body { background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          td:first-child { font-weight: 600; color: #6366f1; width: 40%; }
          .total { font-size: 20px; font-weight: bold; color: #1e1b4b; text-align: right; margin-top: 16px; padding-top: 12px; border-top: 2px solid #6366f1; }
          .badge { display:inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; background: ${bg}; color: ${text}; }
          .footer { font-size: 12px; color: #6b7280; margin-top: 24px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💳 Payment Receipt</h1>
          <p>Receipt #${booking._id.slice(-8).toUpperCase()} • ${format(new Date(booking.createdAt), 'MMMM dd, yyyy')}</p>
        </div>
        <div class="body">
          <table>
            <tr><td>Business</td><td>${business?.name || 'N/A'}</td></tr>
            <tr><td>Service</td><td>${service?.name || 'N/A'}</td></tr>
            <tr><td>Appointment</td><td>${format(startTime, 'MMM dd, yyyy h:mm a')}</td></tr>
            <tr><td>Booking Status</td><td>${booking.status}</td></tr>
            <tr><td>Payment Status</td><td><span class="badge">${booking.paymentStatus}</span></td></tr>
            ${booking.paymentIntentId ? `<tr><td>Transaction ID</td><td>${booking.paymentIntentId}</td></tr>` : ''}
          </table>
          <div class="total">Total: ${booking.currency} ${((booking.amount || 0) / 100).toFixed(2)}</div>
          <p class="footer">Generated on ${new Date().toLocaleString()} • BookEase Platform</p>
        </div>
      </body>
    </html>
  `;
}

function downloadReceipt(booking: Booking) {
  const html = generateReceiptHTML(booking);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${booking._id.slice(-8).toUpperCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function PaymentHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentFilter>('all');

  useEffect(() => {
    api.getBookings().then((data) => {
      setBookings(data);
    }).catch(() => {
      setBookings([]);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const filtered = bookings.filter((b) => filter === 'all' || b.paymentStatus === filter);

  const totalPaid = bookings
    .filter((b) => b.paymentStatus === PaymentStatus.PAID)
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const totalRefunded = bookings
    .filter((b) => b.paymentStatus === PaymentStatus.REFUNDED)
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const currency = bookings[0]?.currency || 'USD';

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
          <p className="text-3xl font-bold" style={{ color: '#059669' }}>{currency} {(totalPaid / 100).toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Refunded</p>
          <p className="text-3xl font-bold" style={{ color: '#6366f1' }}>{currency} {(totalRefunded / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {PAYMENT_FILTERS.map(({ label, value, emoji }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              filter === value ? 'bg-indigo-600 text-white shadow-sm' : ''
            }`}
            style={filter !== value ? { background: 'var(--bg-card)', borderColor: 'var(--border)', border: '1px solid var(--border)', color: 'var(--text-secondary)' } : {}}
          >
            <span>{emoji}</span>
            {label}
          </button>
        ))}
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
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Service</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Business</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Amount</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => {
                  const service = booking.service as Service;
                  const business = booking.business as Business;
                  const { bg, text } = paymentStatusColor(booking.paymentStatus);
                  return (
                    <tr
                      key={booking._id}
                      className="table-row-hover"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {service?.name || 'Service'}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {business?.name || 'Business'}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right" style={{ color: 'var(--text-primary)' }}>
                        {booking.currency} {((booking.amount || 0) / 100).toFixed(2)}
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
                        <button
                          onClick={() => downloadReceipt(booking)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(99,102,241,.1)', color: 'var(--text-secondary)' }}
                          title="Download Receipt"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </button>
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
