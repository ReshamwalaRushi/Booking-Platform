import React, { useState } from 'react';
import { format } from 'date-fns';
import { Booking, BookingStatus, Service, Business } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface BookingCardProps {
  booking: Booking;
  onCancel?: (id: string, reason?: string) => void;
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const service = booking.service as Service;
  const business = booking.business as Business;
  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  const canCancel = [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status);

  const handleCancel = () => {
    onCancel?.(booking._id, cancelReason);
    setShowCancelModal(false);
    setCancelReason('');
  };

  return (
    <>
      <div className="card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{service?.name || 'Service'}</h3>
              <Badge status={booking.status} />
            </div>
            <p className="text-sm text-gray-600 mb-3">{business?.name || 'Business'}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{format(startTime, 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-medium text-gray-900">
                  {format(startTime, 'h:mm a')} – {format(endTime, 'h:mm a')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Duration</p>
                <p className="font-medium text-gray-900">{service?.duration || 0} min</p>
              </div>
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-medium text-gray-900">
                  {booking.currency} {((booking.amount || 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>
            {booking.notes && (
              <p className="mt-3 text-sm text-gray-600 italic">Note: {booking.notes}</p>
            )}
            {booking.zoomJoinUrl && (
              <a
                href={booking.zoomJoinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10l4-2v8l-4-2v-4zm-1 7H3a1 1 0 01-1-1V8a1 1 0 011-1h13a1 1 0 011 1v8a1 1 0 01-1 1z" />
                </svg>
                Join Zoom Meeting
              </a>
            )}
          </div>
        </div>
        {canCancel && onCancel && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button variant="danger" size="sm" onClick={() => setShowCancelModal(true)}>
              Cancel Booking
            </Button>
          </div>
        )}
      </div>

      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Booking" size="sm">
        <p className="text-gray-600 mb-4">Are you sure you want to cancel this booking?</p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason (optional)
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="Tell us why you're cancelling..."
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Keep Booking</Button>
          <Button variant="danger" onClick={handleCancel}>Cancel Booking</Button>
        </div>
      </Modal>
    </>
  );
}
