import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Service } from '../../types';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

type PaymentOption = 'pay_later' | 'deposit' | 'full';

interface BookingFormProps {
  businessId: string;
  service: Service;
  staffId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PAYMENT_OPTIONS: { value: PaymentOption; label: string; desc: string; emoji: string }[] = [
  { value: 'pay_later', label: 'Pay at Venue', desc: 'No payment now, pay on arrival', emoji: '🏪' },
  { value: 'deposit', label: 'Pay Deposit (50%)', desc: 'Secure your slot with a deposit', emoji: '💳' },
  { value: 'full', label: 'Pay Full Now', desc: 'Complete payment via Razorpay', emoji: '✅' },
];

export function BookingForm({ businessId, service, staffId, onSuccess, onCancel }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; availableStaff: number }[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('pay_later');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  const depositAmount = Math.floor(service.price / 2);
  const payableAmount = paymentOption === 'deposit' ? depositAmount : paymentOption === 'full' ? service.price : 0;

  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setSelectedSlot('');
      return;
    }
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const slots = await api.getAvailableSlots(businessId, service._id, selectedDate, staffId);
        setAvailableSlots(slots);
      } catch {
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, businessId, service._id, staffId]);

  const handleRazorpayPayment = async (booking: any): Promise<boolean> => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Payment gateway failed to load. Please try again.');
      return false;
    }

    try {
      const order = await api.createRazorpayOrder(booking._id, payableAmount, service.currency);
      return new Promise((resolve) => {
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'BookEase',
          description: `${service.name} - ${paymentOption === 'deposit' ? '50% Deposit' : 'Full Payment'}`,
          order_id: order.orderId,
          handler: async (response: any) => {
            try {
              await api.verifyRazorpayPayment({
                bookingId: booking._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              toast.success('Payment successful!');
              resolve(true);
            } catch {
              toast.error('Payment verification failed');
              resolve(false);
            }
          },
          prefill: {},
          theme: { color: '#6366f1' },
          modal: { ondismiss: () => resolve(false) },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch {
      toast.error('Could not initiate payment. Booking saved as Pay Later.');
      return true; // Still allow booking
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setIsSubmitting(true);
    try {
      const booking = await api.createBooking({
        businessId,
        serviceId: service._id,
        startTime: selectedSlot,
        notes,
        staffId,
        paymentOption,
      });
      toast.success('Booking created successfully!');

      if (paymentOption !== 'pay_later' && payableAmount > 0) {
        await handleRazorpayPayment(booking);
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg p-4" style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)' }}>
        <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{service.name}</h4>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {service.duration} min • {formatCurrency(service.price)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Select Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={today}
          max={maxDate}
          className="input-field"
          required
        />
      </div>

      {selectedDate && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Select Time Slot <span className="text-red-500">*</span>
          </label>
          {isLoadingSlots ? (
            <LoadingSpinner size="sm" className="py-4" />
          ) : availableSlots.length === 0 ? (
            <p className="text-sm py-2" style={{ color: 'var(--text-secondary)' }}>No available slots for this date</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map(({ slot, availableStaff }) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 px-3 text-sm rounded-lg border transition-all relative ${
                    selectedSlot === slot
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : ''
                  }`}
                  style={selectedSlot !== slot ? { background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border)' } : {}}
                >
                  <div>{format(new Date(slot), 'h:mm a')}</div>
                  {availableStaff > 0 && (
                    <div className={`text-xs mt-0.5 ${selectedSlot === slot ? 'text-white/80' : 'text-green-600'}`}>
                      {availableStaff} avail
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field resize-none"
          rows={2}
          placeholder="Any special requests or notes..."
        />
      </div>

      {/* Payment Options */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Payment Option <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPaymentOption(opt.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                paymentOption === opt.value ? 'border-indigo-500' : ''
              }`}
              style={paymentOption === opt.value
                ? { borderColor: '#6366f1', background: 'rgba(99,102,241,.08)' }
                : { borderColor: 'var(--border)', background: 'var(--bg-input)' }
              }
            >
              <span className="text-xl">{opt.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</p>
              </div>
              {opt.value !== 'pay_later' && (
                <span className="text-sm font-bold" style={{ color: '#6366f1' }}>
                  {formatCurrency(opt.value === 'deposit' ? depositAmount : service.price)}
                </span>
              )}
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentOption === opt.value ? 'border-indigo-500 bg-indigo-500' : ''}`} style={paymentOption !== opt.value ? { borderColor: 'var(--border)' } : {}}>
                {paymentOption === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} fullWidth>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!selectedSlot} fullWidth>
          {paymentOption === 'pay_later' ? 'Confirm Booking' : 'Book & Pay'}
        </Button>
      </div>
    </form>
  );
}
