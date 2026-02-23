import React from 'react';
import { useBookings } from '../../hooks/useBookings';
import { BookingCalendar } from '../../components/Calendar/BookingCalendar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export function CalendarPage() {
  const { bookings, isLoading } = useBookings();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">View and manage your schedule</p>
        </div>
        <Link to="/bookings/new">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <BookingCalendar bookings={bookings} />
      )}
    </div>
  );
}
