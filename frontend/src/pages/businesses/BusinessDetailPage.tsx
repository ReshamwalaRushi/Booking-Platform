import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Business, Service } from '../../types';
import api from '../../services/api';
import { ServiceCard } from '../../components/Service/ServiceCard';
import { BookingForm } from '../../components/Booking/BookingForm';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [biz, svcs] = await Promise.all([api.getBusiness(id), api.getServices(id)]);
        setBusiness(biz);
        setServices(svcs);
      } catch {
        navigate('/businesses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (isLoading) return <LoadingSpinner className="py-20" />;
  if (!business) return null;

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">← Back</Button>

      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
            🏢
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              {business.isVerified && (
                <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-gray-500 capitalize">{business.category}</p>
            <p className="text-gray-700 mt-2">{business.description}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              {business.phone && (
                <span className="flex items-center gap-1">📞 {business.phone}</span>
              )}
              {business.email && (
                <span className="flex items-center gap-1">✉️ {business.email}</span>
              )}
              {business.address?.city && (
                <span className="flex items-center gap-1">📍 {business.address.city}, {business.address.state}</span>
              )}
            </div>
          </div>
        </div>

        {business.workingHours && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Working Hours</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {dayNames.map((day) => {
                const hours = business.workingHours?.[day];
                return (
                  <div key={day} className="text-sm">
                    <span className="font-medium text-gray-700 capitalize">{day.slice(0, 3)}</span>
                    <span className="text-gray-500 ml-2">
                      {hours?.isOpen ? `${hours.open} – ${hours.close}` : 'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Available Services</h2>
      {services.length === 0 ? (
        <p className="text-gray-500">No services available</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {services.map((service) => (
            <ServiceCard key={service._id} service={service} onBook={setSelectedService} />
          ))}
        </div>
      )}

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
