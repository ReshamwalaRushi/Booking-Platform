import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Business, Service, BusinessCategory, Staff } from '../../types';
import api from '../../services/api';
import { BusinessList } from '../../components/Business/BusinessList';
import { ServiceCard } from '../../components/Service/ServiceCard';
import { BookingForm } from '../../components/Booking/BookingForm';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';

type Step = 'business' | 'service' | 'staff' | 'booking';

export function NewBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillBusinessId = searchParams.get('businessId');
  const prefillServiceId = searchParams.get('serviceId');

  const [step, setStep] = useState<Step>('business');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Pre-fill from URL params: load business → services → skip to staff step
  useEffect(() => {
    if (!prefillBusinessId || !prefillServiceId) return;
    (async () => {
      setIsLoading(true);
      try {
        const [biz, svcs] = await Promise.all([
          api.getBusiness(prefillBusinessId),
          api.getServices(prefillBusinessId),
        ]);
        setSelectedBusiness(biz);
        setServices(svcs);
        const service = svcs.find((s) => s._id === prefillServiceId);
        if (service) {
          setSelectedService(service);
          const staff = await api.getStaff(prefillBusinessId);
          const assigned = staff.filter((s) => !s.assignedServices?.length || s.assignedServices.includes(service._id));
          setStaffList(assigned.filter((s) => s.isActive));
          setStep('staff');
        }
      } catch {
        // fall through to normal flow
      } finally {
        setIsLoading(false);
      }
    })();
  }, [prefillBusinessId, prefillServiceId]);

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

  const handleServiceSelect = async (service: Service) => {
    setSelectedService(service);
    if (!selectedBusiness) return;
    setIsLoading(true);
    try {
      const staff = await api.getStaff(selectedBusiness._id);
      // Filter staff assigned to this service
      const assignedStaff = staff.filter((s) =>
        !s.assignedServices?.length || s.assignedServices.includes(service._id)
      );
      setStaffList(assignedStaff.filter((s) => s.isActive));
      setStep('staff');
    } catch {
      setStaffList([]);
      setStep('staff');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffSelect = (staff: Staff | null) => {
    setSelectedStaff(staff);
    setStep('booking');
  };

  const stepLabels: Record<Step, string> = {
    business: 'Choose Business',
    service: 'Select Service',
    staff: 'Select Staff',
    booking: 'Book Appointment',
  };

  const steps: Step[] = ['business', 'service', 'staff', 'booking'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Book an Appointment</h1>
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 shrink-0 ${i <= currentStepIndex ? 'text-indigo-600' : 'text-gray-400'}`} style={i > currentStepIndex ? { color: 'var(--text-muted)' } : {}}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i < currentStepIndex ? 'bg-indigo-600 text-white' :
                  i === currentStepIndex ? 'border-2 border-indigo-600 text-indigo-600' :
                  'border-2 border-gray-300 text-gray-400'
                }`} style={i === currentStepIndex ? {} : i > currentStepIndex ? { borderColor: 'var(--border)' } : {}}>
                  {i < currentStepIndex ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block" style={{ color: i <= currentStepIndex ? undefined : 'var(--text-muted)' }}>{stepLabels[s]}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px min-w-[16px] ${i < currentStepIndex ? 'bg-indigo-600' : 'bg-gray-300'}`} style={i >= currentStepIndex ? { backgroundColor: 'var(--border)' } : {}} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {step === 'business' && (
        <div>
          <div className="mb-4 flex gap-2 flex-wrap">
            <button onClick={() => setCategoryFilter('')} className={`px-3 py-1.5 rounded-full text-sm ${!categoryFilter ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`} style={categoryFilter ? { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}>All</button>
            {Object.values(BusinessCategory).map((cat) => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-full text-sm capitalize ${categoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`} style={categoryFilter !== cat ? { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}>{cat}</button>
            ))}
          </div>
          <BusinessList businesses={businesses} isLoading={isLoading} onSelect={handleBusinessSelect} />
        </div>
      )}

      {step === 'service' && selectedBusiness && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setStep('business')}>← Back</Button>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedBusiness.name}</h2>
              <p className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>{selectedBusiness.category}</p>
            </div>
          </div>
          {isLoading ? <LoadingSpinner className="py-12" /> : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {services.length === 0 ? (
                <p className="col-span-2 py-8 text-center" style={{ color: 'var(--text-secondary)' }}>No services available</p>
              ) : (
                services.map((service) => (
                  <ServiceCard key={service._id} service={service} onBook={handleServiceSelect} />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {step === 'staff' && selectedBusiness && selectedService && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setStep('service')}>← Back</Button>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Choose Your Staff</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedService.name} at {selectedBusiness.name}</p>
            </div>
          </div>
          {isLoading ? <LoadingSpinner className="py-12" /> : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {/* No preference option */}
              <button
                onClick={() => handleStaffSelect(null)}
                className="card text-left hover:shadow-md transition-all border-2 hover:border-indigo-400"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 mx-auto" style={{ background: 'rgba(99,102,241,.12)' }}>
                  🎲
                </div>
                <p className="text-center font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>No Preference</p>
                <p className="text-center text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Any available staff</p>
              </button>
              {staffList.map((staff) => (
                <button
                  key={staff._id}
                  onClick={() => handleStaffSelect(staff)}
                  className="card text-left hover:shadow-md transition-all border-2 hover:border-indigo-400"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-3 mx-auto text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                  </div>
                  <p className="text-center font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{staff.firstName} {staff.lastName}</p>
                  {staff.bio && <p className="text-center text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{staff.bio}</p>}
                </button>
              ))}
              {staffList.length === 0 && (
                <p className="col-span-3 text-center py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Continuing without staff selection...
                  <button className="ml-2 text-indigo-500 underline" onClick={() => handleStaffSelect(null)}>Proceed</button>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'booking' && selectedBusiness && selectedService && (
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setStep('staff')}>← Back</Button>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Complete Your Booking</h2>
              {selectedStaff && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>with {selectedStaff.firstName} {selectedStaff.lastName}</p>}
            </div>
          </div>
          <div className="card">
            <BookingForm
              businessId={selectedBusiness._id}
              service={selectedService}
              staffId={selectedStaff?._id}
              onSuccess={() => navigate('/bookings')}
              onCancel={() => setStep('staff')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
