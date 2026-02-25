import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Business, Review, Service } from '../../types';
import api from '../../services/api';
import { ServiceCard } from '../../components/Service/ServiceCard';
import { BookingForm } from '../../components/Booking/BookingForm';
import { ReviewForm } from '../../components/Review/ReviewForm';
import { ReviewList } from '../../components/Review/ReviewList';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import toast from 'react-hot-toast';

function isFavorite(id: string): boolean {
  try {
    const stored = localStorage.getItem('bookease_favorites');
    const ids: string[] = stored ? JSON.parse(stored) : [];
    return ids.includes(id);
  } catch { return false; }
}

function toggleFavorite(id: string): boolean {
  try {
    const stored = localStorage.getItem('bookease_favorites');
    const ids: string[] = stored ? JSON.parse(stored) : [];
    const idx = ids.indexOf(id);
    if (idx >= 0) {
      ids.splice(idx, 1);
      localStorage.setItem('bookease_favorites', JSON.stringify(ids));
      return false;
    } else {
      ids.push(id);
      localStorage.setItem('bookease_favorites', JSON.stringify(ids));
      return true;
    }
  } catch { return false; }
}

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!id) return;
    setFavorited(isFavorite(id));
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [biz, svcs, revs] = await Promise.all([
          api.getBusiness(id),
          api.getServices(id),
          api.getBusinessReviews(id),
        ]);
        setBusiness(biz);
        setServices(svcs);
        setReviews(revs);
      } catch {
        navigate('/businesses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleFavorite = () => {
    if (!id) return;
    const newVal = toggleFavorite(id);
    setFavorited(newVal);
    toast.success(newVal ? 'Added to favorites!' : 'Removed from favorites');
  };

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (!business) return null;

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">← Back</Button>

      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0" style={{ background: 'rgba(99,102,241,.12)' }}>
            🏢
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{business.name}</h1>
              {business.isVerified && (
                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <button
                onClick={handleFavorite}
                className="ml-auto p-2 rounded-lg transition-colors"
                style={{ color: favorited ? '#ef4444' : 'var(--text-muted)', background: favorited ? 'rgba(239,68,68,.1)' : 'rgba(99,102,241,.06)' }}
                title={favorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg className="w-5 h-5" fill={favorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
            <p className="capitalize" style={{ color: 'var(--text-secondary)' }}>{business.category}</p>
            {avgRating && (
              <p className="text-sm text-yellow-600 mt-1">
                ★ {avgRating} <span style={{ color: 'var(--text-muted)' }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </p>
            )}
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{business.description}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {business.phone && <span className="flex items-center gap-1">📞 {business.phone}</span>}
              {business.email && <span className="flex items-center gap-1">✉️ {business.email}</span>}
              {business.address?.city && <span className="flex items-center gap-1">📍 {business.address.city}, {business.address.state}</span>}
            </div>
          </div>
        </div>

        {business.workingHours && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Working Hours</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {dayNames.map((day) => {
                const hours = business.workingHours?.[day];
                return (
                  <div key={day} className="text-sm">
                    <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{day.slice(0, 3)}</span>
                    <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                      {hours?.isOpen ? `${hours.open} – ${hours.close}` : 'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Available Services</h2>
      {services.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No services available</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {services.map((service) => (
            <ServiceCard key={service._id} service={service} onBook={setSelectedService} />
          ))}
        </div>
      )}

      <div className="card mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Reviews</h2>
          {user && user.role === UserRole.CLIENT && !showReviewForm && (
            <Button size="sm" variant="ghost" onClick={() => setShowReviewForm(true)}>
              ✍️ Write a Review
            </Button>
          )}
        </div>
        {showReviewForm && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(99,102,241,.06)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Share your experience</h3>
            <ReviewForm
              businessId={business._id}
              onSuccess={() => {
                setShowReviewForm(false);
                api.getBusinessReviews(business._id).then(setReviews);
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        )}
        <ReviewList reviews={reviews} />
      </div>

      <Modal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        title="Book Appointment"
        size="md"
      >
        {selectedService && (
          <BookingForm
            businessId={business._id}
            service={selectedService}
            onSuccess={() => { setSelectedService(null); navigate('/bookings'); }}
            onCancel={() => setSelectedService(null)}
          />
        )}
      </Modal>
    </div>
  );
}
