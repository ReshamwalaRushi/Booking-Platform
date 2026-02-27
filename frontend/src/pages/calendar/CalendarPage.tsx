import React, { useState } from 'react';
import { useBookings } from '../../hooks/useBookings';
import { BookingCalendar } from '../../components/Calendar/BookingCalendar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import api from '../../services/api';
import toast from 'react-hot-toast';

export function CalendarPage() {
  const { bookings, isLoading, refetch } = useBookings();
  const { user } = useAuth();

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await api.confirmBooking(bookingId);
      toast.success('Booking confirmed!');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm booking');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">View and manage your schedule</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <BookingCalendar
          bookings={bookings}
          isBusinessOwner={user?.role === UserRole.BUSINESS_OWNER}
          onConfirmBooking={handleConfirmBooking}
        />
      )}
    </div>
  );
}
