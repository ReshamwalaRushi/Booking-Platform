import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getDay } from 'date-fns';
import { Booking, BookingStatus, Service, Business } from '../../types';
import { Badge } from '../common/Badge';

interface BookingCalendarProps {
  bookings: Booking[];
  onDateClick?: (date: Date) => void;
}

export function BookingCalendar({ bookings, onDateClick }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = getDay(monthStart);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((booking) => {
      const dateKey = format(new Date(booking.startTime), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(booking);
    });
    return map;
  }, [bookings]);

  const selectedDateBookings = selectedDate
    ? bookingsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    onDateClick?.(day);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium">
              Today
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white h-14" />
          ))}
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayBookings = bookingsByDate[dateKey] || [];
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDayToday = isToday(day);
            return (
              <button
                key={dateKey}
                onClick={() => handleDateClick(day)}
                className={`bg-white h-14 flex flex-col items-center justify-start pt-2 px-1 hover:bg-primary-50 transition-colors relative ${isSelected ? 'bg-primary-50' : ''}`}
              >
                <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium ${isDayToday ? 'bg-primary-600 text-white' : isSelected ? 'bg-primary-100 text-primary-700' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </span>
                {dayBookings.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dayBookings.slice(0, 3).map((b, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${b.status === BookingStatus.CONFIRMED ? 'bg-green-500' : b.status === BookingStatus.PENDING ? 'bg-yellow-500' : b.status === BookingStatus.CANCELLED ? 'bg-red-500' : 'bg-blue-500'}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />Pending</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Confirmed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Completed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Cancelled</span>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">
          {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
        </h3>
        {selectedDate && selectedDateBookings.length === 0 && (
          <p className="text-sm text-gray-500">No bookings on this day</p>
        )}
        <div className="space-y-3">
          {selectedDateBookings.map((booking) => {
            const service = booking.service as Service;
            const business = booking.business as Business;
            return (
              <div key={booking._id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{service?.name}</span>
                  <Badge status={booking.status} />
                </div>
                <p className="text-xs text-gray-500">{business?.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(booking.startTime), 'h:mm a')} – {format(new Date(booking.endTime), 'h:mm a')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
