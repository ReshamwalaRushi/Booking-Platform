import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const adminNavItems: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { path: '/admin/businesses', label: 'Businesses', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { path: '/admin/users', label: 'Users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

const businessNavItems: NavItem[] = [
  { path: '/business/dashboard', label: 'Dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { path: '/business/services', label: 'Services', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { path: '/business/staff', label: 'Staff', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { path: '/calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { path: '/bookings', label: 'Bookings', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { path: '/business/profile', label: 'Business Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

const clientNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { path: '/calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { path: '/bookings', label: 'My Bookings', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { path: '/businesses', label: 'Browse Businesses', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { path: '/client/profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

function getNavItems(role?: UserRole): NavItem[] {
  if (role === UserRole.ADMIN) return adminNavItems;
  if (role === UserRole.BUSINESS_OWNER) return businessNavItems;
  return clientNavItems;
}

const roleLabel: Record<string, string> = {
  admin: 'Administrator',
  business_owner: 'Business Owner',
  client: 'Client',
};

export function Sidebar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = getNavItems(user?.role);
  const roleDisplay = roleLabel[user?.role ?? 'client'] ?? 'User';

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed bottom-5 right-5 z-50 w-13 h-13 p-3 text-white rounded-2xl shadow-xl transition-all"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 25px rgba(99,102,241,.5)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-dark fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 overflow-y-auto z-40 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* User profile chip */}
          <div
            className="mb-6 p-4 rounded-2xl relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,.2) 0%, rgba(139,92,246,.2) 100%)', border: '1px solid rgba(99,102,241,.3)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,.4)' }}
              >
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-indigo-300 mt-0.5">{roleDisplay}</p>
              </div>
            </div>
            {/* decorative orb */}
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Navigation</p>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'nav-item-active text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/8'
                  }`
                }
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
                </svg>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="pt-4 border-t border-white/5">
            <p className="text-xs text-slate-600 text-center">BookEase © 2025</p>
          </div>
        </div>
      </aside>
    </>
  );
}
