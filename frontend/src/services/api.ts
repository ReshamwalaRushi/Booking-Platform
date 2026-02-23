import axios, { AxiosInstance, AxiosError } from 'axios';
import { AuthResponse, Booking, Business, Service, User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/login', { email, password });
    return data;
  }

  async register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/register', payload);
    return data;
  }

  // Users
  async getMe(): Promise<User> {
    const { data } = await this.client.get<User>('/users/me');
    return data;
  }

  async updateMe(payload: Partial<User>): Promise<User> {
    const { data } = await this.client.patch<User>('/users/me', payload);
    return data;
  }

  // Businesses
  async getBusinesses(category?: string): Promise<Business[]> {
    const params = category ? { category } : {};
    const { data } = await this.client.get<Business[]>('/businesses', { params });
    return data;
  }

  async getBusiness(id: string): Promise<Business> {
    const { data } = await this.client.get<Business>(`/businesses/${id}`);
    return data;
  }

  async getMyBusinesses(): Promise<Business[]> {
    const { data } = await this.client.get<Business[]>('/businesses/owner/my-businesses');
    return data;
  }

  async createBusiness(payload: Partial<Business>): Promise<Business> {
    const { data } = await this.client.post<Business>('/businesses', payload);
    return data;
  }

  async updateBusiness(id: string, payload: Partial<Business>): Promise<Business> {
    const { data } = await this.client.patch<Business>(`/businesses/${id}`, payload);
    return data;
  }

  // Services
  async getServices(businessId?: string): Promise<Service[]> {
    const params = businessId ? { businessId } : {};
    const { data } = await this.client.get<Service[]>('/services', { params });
    return data;
  }

  async getService(id: string): Promise<Service> {
    const { data } = await this.client.get<Service>(`/services/${id}`);
    return data;
  }

  async createService(payload: Partial<Service> & { businessId: string }): Promise<Service> {
    const { data } = await this.client.post<Service>('/services', payload);
    return data;
  }

  // Bookings
  async getBookings(params?: { status?: string; businessId?: string }): Promise<Booking[]> {
    const { data } = await this.client.get<Booking[]>('/bookings', { params });
    return data;
  }

  async getBooking(id: string): Promise<Booking> {
    const { data } = await this.client.get<Booking>(`/bookings/${id}`);
    return data;
  }

  async createBooking(payload: {
    businessId: string;
    serviceId: string;
    startTime: string;
    notes?: string;
  }): Promise<Booking> {
    const { data } = await this.client.post<Booking>('/bookings', payload);
    return data;
  }

  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const params = reason ? { reason } : {};
    const { data } = await this.client.delete<Booking>(`/bookings/${id}`, { params });
    return data;
  }

  async getAvailableSlots(businessId: string, serviceId: string, date: string): Promise<string[]> {
    const { data } = await this.client.get<string[]>('/bookings/available-slots', {
      params: { businessId, serviceId, date },
    });
    return data;
  }

  async updateBooking(id: string, payload: { status?: string; notes?: string }): Promise<Booking> {
    const { data } = await this.client.patch<Booking>(`/bookings/${id}`, payload);
    return data;
  }

  // Payments
  async createPaymentIntent(bookingId: string, amount: number): Promise<{ client_secret: string }> {
    const { data } = await this.client.post('/payments/create-intent', { bookingId, amount });
    return data;
  }

  // Calendar
  async getCalendarAuthUrl(): Promise<{ url: string }> {
    const { data } = await this.client.get('/calendar/auth-url');
    return data;
  }

  // Staff
  async getStaff(businessId: string): Promise<unknown[]> {
    const { data } = await this.client.get('/staff', { params: { businessId } });
    return data;
  }

  async createStaff(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post('/staff', payload);
    return data;
  }

  async updateStaff(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.patch(`/staff/${id}`, payload);
    return data;
  }

  async deleteStaff(id: string): Promise<void> {
    await this.client.delete(`/staff/${id}`);
  }

  // Reviews
  async getBusinessReviews(businessId: string): Promise<unknown[]> {
    const { data } = await this.client.get(`/reviews/business/${businessId}`);
    return data;
  }

  async createReview(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post('/reviews', payload);
    return data;
  }

  // Admin
  async getAdminStats(): Promise<Record<string, unknown>> {
    const { data } = await this.client.get('/admin/dashboard');
    return data;
  }

  async getPendingBusinesses(): Promise<Business[]> {
    const { data } = await this.client.get<Business[]>('/admin/businesses/pending');
    return data;
  }

  async verifyBusiness(id: string, approved: boolean, notes?: string): Promise<Business> {
    const { data } = await this.client.patch<Business>(`/admin/businesses/${id}/verify`, { approved, notes });
    return data;
  }

  async adminGetUsers(page?: number): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const { data } = await this.client.get('/admin/users', { params: page ? { page } : {} });
    return data;
  }

  async adminGetBusinesses(page?: number): Promise<{ data: Business[]; total: number; page: number; limit: number }> {
    const { data } = await this.client.get('/admin/businesses', { params: page ? { page } : {} });
    return data;
  }

  async adminUpdateUserStatus(id: string, isActive: boolean, reason?: string): Promise<User> {
    const { data } = await this.client.patch<User>(`/admin/users/${id}/status`, { isActive, reason });
    return data;
  }

  async adminUpdateBusinessStatus(id: string, isActive: boolean, reason?: string): Promise<Business> {
    const { data } = await this.client.patch<Business>(`/admin/businesses/${id}/status`, { isActive, reason });
    return data;
  }

  // Business services management
  async updateService(id: string, payload: Partial<Service>): Promise<Service> {
    const { data } = await this.client.patch<Service>(`/services/${id}`, payload);
    return data;
  }

  async deleteService(id: string): Promise<void> {
    await this.client.delete(`/services/${id}`);
  }
}

export const api = new ApiService();
export default api;
