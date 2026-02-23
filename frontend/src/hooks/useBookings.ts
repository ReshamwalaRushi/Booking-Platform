import { useState, useEffect, useCallback } from 'react';
import { Booking, BookingStatus } from '../types';
import api from '../services/api';
import toast from 'react-hot-toast';

export function useBookings(filters?: { status?: BookingStatus; businessId?: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const status = filters?.status;
  const businessId = filters?.businessId;

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getBookings({ status, businessId });
      setBookings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  }, [status, businessId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const cancelBooking = useCallback(async (id: string, reason?: string) => {
    try {
      await api.cancelBooking(id, reason);
      toast.success('Booking cancelled successfully');
      await fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  }, [fetchBookings]);

  return { bookings, isLoading, error, refetch: fetchBookings, cancelBooking };
}
