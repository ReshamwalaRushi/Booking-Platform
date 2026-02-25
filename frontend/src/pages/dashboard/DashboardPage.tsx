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

const quickActions = [
  { to: '/bookings/new', emoji: '📅', label: 'Book Appointment', desc: 'Schedule a new booking', color: '#6366f1' },
  { to: '/businesses', emoji: '🏢', label: 'Browse Businesses', desc: 'Find service providers', color: '#8b5cf6' },
  { to: '/calendar', emoji: '📆', label: 'View Calendar', desc: 'See your schedule', color: '#06b6d4' },
  { to: '/bookings', emoji: '📋', label: 'My Bookings', desc: 'Manage your bookings', color: '#10b981' },
];

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    { label: 'Total Bookings', value: stats.total, cardClass: 'stat-card-purple', icon: '📅' },
    { label: 'Upcoming', value: stats.upcoming, cardClass: 'stat-card-blue', icon: '⏰' },
    { label: 'Completed', value: stats.completed, cardClass: 'stat-card-green', icon: '✅' },
    { label: 'Cancelled', value: stats.cancelled, cardClass: 'stat-card-orange', icon: '❌' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-glow text-xs">Client Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-white mt-2">
            {greeting}, <span className="gradient-text">{user?.firstName}</span>! 👋
          </h1>
          <p className="text-slate-400 mt-1">Here's what's happening with your bookings today.</p>
        </div>
        <Link to="/bookings/new">
          <Button size="lg">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className={`${stat.cardClass} relative overflow-hidden`}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-4xl font-extrabold mb-1 tracking-tight">
              {isLoading ? <span className="opacity-40">—</span> : stat.value}
            </div>
            <div className="text-sm font-medium opacity-80">{stat.label}</div>
            {/* decorative circle */}
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10" />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Upcoming Bookings</h2>
            <Link to="/bookings" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              View all →
            </Link>
          </div>
          {isLoading ? (
            <LoadingSpinner className="py-8" />
          ) : upcomingBookings.length === 0 ? (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-400 mb-4">No upcoming bookings yet</p>
              <Link to="/bookings/new">
                <Button size="sm">Book Now</Button>
              </Link>
            </div>
          ) : (
            <BookingList bookings={upcomingBookings} isLoading={false} />
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to}>
                <div
                  className="card-modern cursor-pointer h-full group"
                  style={{ borderColor: `${action.color}25` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${action.color}20` }}
                  >
                    {action.emoji}
                  </div>
                  <p className="font-semibold text-white text-sm">{action.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
