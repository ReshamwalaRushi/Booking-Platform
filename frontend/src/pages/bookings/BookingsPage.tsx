import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBookings } from '../../hooks/useBookings';
import { BookingList } from '../../components/Booking/BookingList';
import { Button } from '../../components/common/Button';
import { BookingStatus } from '../../types';

const STATUS_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Upcoming', value: BookingStatus.CONFIRMED },
  { label: 'Pending', value: BookingStatus.PENDING },
  { label: 'Completed', value: BookingStatus.COMPLETED },
  { label: 'Cancelled', value: BookingStatus.CANCELLED },
];

export function BookingsPage() {
  const [activeFilter, setActiveFilter] = useState<BookingStatus | undefined>(undefined);
  const { bookings, isLoading, cancelBooking } = useBookings({ status: activeFilter });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Link to="/bookings/new">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setActiveFilter(value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <BookingList bookings={bookings} isLoading={isLoading} onCancel={cancelBooking} />
    </div>
  );
}
