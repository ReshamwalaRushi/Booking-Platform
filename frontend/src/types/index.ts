export enum UserRole {
  CLIENT = 'client',
  BUSINESS_OWNER = 'business_owner',
  ADMIN = 'admin',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum BusinessCategory {
  SALON = 'salon',
  CLINIC = 'clinic',
  CONSULTANT = 'consultant',
  FITNESS = 'fitness',
  SPA = 'spa',
  DENTAL = 'dental',
  VETERINARY = 'veterinary',
  OTHER = 'other',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface Business {
  _id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  owner: User | string;
  phone?: string;
  email?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  workingHours?: Record<string, { open: string; close: string; isOpen: boolean }>;
  logo?: string;
  images?: string[];
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  createdAt: string;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  business: Business | string;
  duration: number;
  price: number;
  currency: string;
  category?: string;
  images?: string[];
  isActive: boolean;
  maxCapacity: number;
  requiresZoom: boolean;
  createdAt: string;
}

export interface Booking {
  _id: string;
  client: User | string;
  business: Business | string;
  service: Service | string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  amount: number;
  currency: string;
  notes?: string;
  googleCalendarEventId?: string;
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  zoomStartUrl?: string;
  reminderSent: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  confirmedAt?: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
  error?: string;
}
