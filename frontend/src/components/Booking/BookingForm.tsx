import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Service } from '../../types';
import api from '../../services/api';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

interface BookingFormProps {
  businessId: string;
  service: Service;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BookingForm({ businessId, service, onSuccess, onCancel }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setSelectedSlot('');
      return;
    }
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const slots = await api.getAvailableSlots(businessId, service._id, selectedDate);
        setAvailableSlots(slots);
      } catch {
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, businessId, service._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setIsSubmitting(true);
    try {
      await api.createBooking({ businessId, serviceId: service._id, startTime: selectedSlot, notes });
      toast.success('Booking created successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-primary-50 rounded-lg p-4">
        <h4 className="font-medium text-primary-900">{service.name}</h4>
        <p className="text-sm text-primary-700 mt-1">
          {service.duration} min • {service.currency} {(service.price / 100).toFixed(2)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Time Slot <span className="text-red-500">*</span>
          </label>
          {isLoadingSlots ? (
            <LoadingSpinner size="sm" className="py-4" />
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No available slots for this date</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                    selectedSlot === slot
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {format(new Date(slot), 'h:mm a')}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field resize-none"
          rows={3}
          placeholder="Any special requests or notes..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} fullWidth>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!selectedSlot} fullWidth>
          Confirm Booking
        </Button>
      </div>
    </form>
  );
}
