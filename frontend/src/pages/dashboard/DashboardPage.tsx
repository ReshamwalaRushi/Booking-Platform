import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Booking, BookingStatus } from '../../types';
import api from '../../services/api';
import { BookingList } from '../../components/Booking/BookingList';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface Stats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getBookings();
        setBookings(data);
        const now = new Date();
        setStats({
          total: data.length,
          upcoming: data.filter((b) => [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(b.status) && new Date(b.startTime) > now).length,
          completed: data.filter((b) => b.status === BookingStatus.COMPLETED).length,
          cancelled: data.filter((b) => b.status === BookingStatus.CANCELLED).length,
        });
      } catch {
        // handle silently
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const upcomingBookings = bookings
    .filter((b) => [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(b.status) && new Date(b.startTime) > new Date())
    .slice(0, 4);

  const statCards = [
    { label: 'Total Bookings', value: stats.total, cardClass: 'stat-card-purple', icon: '📅' },
    { label: 'Upcoming', value: stats.upcoming, cardClass: 'stat-card-blue', icon: '⏰' },
    { label: 'Completed', value: stats.completed, cardClass: 'stat-card-green', icon: '✅' },
    { label: 'Cancelled', value: stats.cancelled, cardClass: 'stat-card-orange', icon: '❌' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your bookings</p>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className={stat.cardClass}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-3xl font-bold mb-1">{isLoading ? '—' : stat.value}</div>
            <div className="text-sm font-medium opacity-90">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
            <Link to="/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
          </div>
          {isLoading ? (
            <LoadingSpinner className="py-8" />
          ) : upcomingBookings.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500 mb-4">No upcoming bookings</p>
              <Link to="/bookings/new">
                <Button size="sm">Book Now</Button>
              </Link>
            </div>
          ) : (
            <BookingList bookings={upcomingBookings} isLoading={false} />
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/bookings/new', icon: '📅', label: 'Book Appointment', desc: 'Schedule a new booking' },
              { to: '/businesses', icon: '🏢', label: 'Browse Businesses', desc: 'Find service providers' },
              { to: '/calendar', icon: '📆', label: 'View Calendar', desc: 'See your schedule' },
              { to: '/bookings', icon: '📋', label: 'My Bookings', desc: 'Manage your bookings' },
            ].map((action) => (
              <Link key={action.to} to={action.to}>
                <div className="card hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
