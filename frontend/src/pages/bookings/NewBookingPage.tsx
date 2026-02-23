import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Business, Service, BusinessCategory } from '../../types';
import api from '../../services/api';
import { BusinessList } from '../../components/Business/BusinessList';
import { ServiceCard } from '../../components/Service/ServiceCard';
import { BookingForm } from '../../components/Booking/BookingForm';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';

type Step = 'business' | 'service' | 'booking';

export function NewBookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('business');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true);
      try {
        const data = await api.getBusinesses(categoryFilter || undefined);
        setBusinesses(data);
      } catch {
        setBusinesses([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBusinesses();
  }, [categoryFilter]);

  const handleBusinessSelect = async (business: Business) => {
    setSelectedBusiness(business);
    setIsLoading(true);
    try {
      const data = await api.getServices(business._id);
      setServices(data);
      setStep('service');
    } catch {
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('booking');
  };

  const stepLabels: Record<Step, string> = {
    business: 'Choose a Business',
    service: 'Select a Service',
    booking: 'Book Appointment',
  };

  const steps: Step[] = ['business', 'service', 'booking'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
        <div className="flex items-center gap-2 mt-4">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${i <= currentStepIndex ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${i < currentStepIndex ? 'bg-primary-600 text-white' : i === currentStepIndex ? 'border-2 border-primary-600 text-primary-600' : 'border-2 border-gray-300 text-gray-400'}`}>
                  {i < currentStepIndex ? '✓' : i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{stepLabels[s]}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-px ${i < currentStepIndex ? 'bg-primary-600' : 'bg-gray-300'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {step === 'business' && (
        <div>
          <div className="mb-4 flex gap-2 flex-wrap">
            <button onClick={() => setCategoryFilter('')} className={`px-3 py-1.5 rounded-full text-sm ${!categoryFilter ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>All</button>
            {Object.values(BusinessCategory).map((cat) => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-full text-sm capitalize ${categoryFilter === cat ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>{cat}</button>
            ))}
          </div>
          <BusinessList businesses={businesses} isLoading={isLoading} onSelect={handleBusinessSelect} />
          <div className="mt-4 text-sm text-gray-500">
            Click on a business to select it, then choose a service.
          </div>
        </div>
      )}

      {step === 'service' && selectedBusiness && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setStep('business')}>← Back</Button>
            <div>
              <h2 className="font-semibold text-gray-900">{selectedBusiness.name}</h2>
              <p className="text-sm text-gray-500 capitalize">{selectedBusiness.category}</p>
            </div>
          </div>
          {isLoading ? <LoadingSpinner className="py-12" /> : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {services.length === 0 ? (
                <p className="text-gray-500 col-span-2 py-8 text-center">No services available for this business</p>
              ) : (
                services.map((service) => (
                  <ServiceCard key={service._id} service={service} onBook={handleServiceSelect} />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {step === 'booking' && selectedBusiness && selectedService && (
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setStep('service')}>← Back</Button>
            <h2 className="font-semibold text-gray-900">Complete Your Booking</h2>
          </div>
          <div className="card">
            <BookingForm
              businessId={selectedBusiness._id}
              service={selectedService}
              onSuccess={() => navigate('/bookings')}
              onCancel={() => setStep('service')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
