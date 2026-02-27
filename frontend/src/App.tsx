import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserRole } from './types';
import { Layout } from './components/Layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { BookingsPage } from './pages/bookings/BookingsPage';
import { NewBookingPage } from './pages/bookings/NewBookingPage';
import { BusinessesPage } from './pages/businesses/BusinessesPage';
import { BusinessDetailPage } from './pages/businesses/BusinessDetailPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminBusinessesPage } from './pages/admin/AdminBusinessesPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { BusinessDashboardPage } from './pages/business/BusinessDashboardPage';
import { BusinessServicesPage } from './pages/business/BusinessServicesPage';
import { BusinessStaffPage } from './pages/business/BusinessStaffPage';
import { BusinessProfilePage } from './pages/business/BusinessProfilePage';
import { ClientProfilePage } from './pages/client/ClientProfilePage';
import { LandingPage } from './pages/landing/LandingPage';
import { PaymentHistoryPage } from './pages/payments/PaymentHistoryPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function AuthRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LandingPage />;
  if (user?.role === UserRole.ADMIN) return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === UserRole.BUSINESS_OWNER) return <Navigate to="/business/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthRedirect />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="bookings/new" element={<NewBookingPage />} />
        <Route path="businesses" element={<BusinessesPage />} />
        <Route path="businesses/:id" element={<BusinessDetailPage />} />
        {/* Admin routes */}
        <Route path="admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="admin/businesses" element={<AdminBusinessesPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        {/* Business owner routes */}
        <Route path="business/dashboard" element={<BusinessDashboardPage />} />
        <Route path="business/services" element={<BusinessServicesPage />} />
        <Route path="business/staff" element={<BusinessStaffPage />} />
        <Route path="business/profile" element={<BusinessProfilePage />} />
        {/* Client routes */}
        <Route path="client/profile" element={<ClientProfilePage />} />
        <Route path="payments/history" element={<PaymentHistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '10px', background: '#333', color: '#fff' },
              success: { style: { background: '#10b981' } },
              error: { style: { background: '#ef4444' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
