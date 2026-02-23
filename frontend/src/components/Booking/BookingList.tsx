import React from 'react';
import { Booking } from '../../types';
import { BookingCard } from './BookingCard';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface BookingListProps {
  bookings: Booking[];
  isLoading: boolean;
  onCancel?: (id: string, reason?: string) => void;
}

export function BookingList({ bookings, isLoading, onCancel }: BookingListProps) {
  if (isLoading) return <LoadingSpinner className="py-12" />;

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-gray-500">No bookings found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {bookings.map((booking) => (
        <BookingCard key={booking._id} booking={booking} onCancel={onCancel} />
      ))}
    </div>
  );
}
