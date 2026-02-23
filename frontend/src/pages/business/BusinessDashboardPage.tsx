import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Booking, Business, BookingStatus } from '../../types';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function BusinessDashboardPage() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const biz = await api.getMyBusinesses();
        setBusinesses(biz);
        if (biz.length > 0) {
          const allBookings = await api.getBookings({ businessId: biz[0]._id });
          setBookings(allBookings);
        }
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayBookings = bookings.filter((b) => {
    const d = new Date(b.startTime);
    return d >= today && d < tomorrow;
  });

  const totalRevenue = bookings
    .filter((b) => b.status === BookingStatus.COMPLETED)
    .reduce((sum, b) => sum + b.amount, 0);

  const statCards = [
    { label: "Today's Appointments", value: todayBookings.length, color: 'bg-primary-50 text-primary-700', icon: '📅' },
    { label: 'Total Bookings', value: bookings.length, color: 'bg-blue-50 text-blue-700', icon: '📋' },
    { label: 'Completed', value: bookings.filter((b) => b.status === BookingStatus.COMPLETED).length, color: 'bg-green-50 text-green-700', icon: '✅' },
    { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'bg-yellow-50 text-yellow-700', icon: '💰' },
  ];

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName}! 👋</h1>
          <p className="text-gray-600 mt-1">
            {businesses.length > 0 ? businesses[0].name : 'Your business dashboard'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className={`card ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold mb-1">{String(s.value)}</div>
            <div className="text-sm font-medium opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Appointments</h2>
          {todayBookings.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No appointments today</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {todayBookings.slice(0, 5).map((b) => (
                <li key={b._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {typeof b.client === 'object' ? `${b.client.firstName} ${b.client.lastName}` : 'Client'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    b.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/business/services', icon: '🛎️', label: 'Manage Services', desc: 'Add or edit services' },
              { to: '/business/staff', icon: '👤', label: 'Manage Staff', desc: 'View your team' },
              { to: '/calendar', icon: '📆', label: 'View Calendar', desc: 'See your schedule' },
              { to: '/bookings', icon: '📋', label: 'All Bookings', desc: 'Manage bookings' },
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
