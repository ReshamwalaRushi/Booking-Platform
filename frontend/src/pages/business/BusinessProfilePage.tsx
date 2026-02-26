import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Business, BusinessCategory } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface ProfileForm {
  name: string;
  description: string;
  category: BusinessCategory | '';
  phone: string;
  email: string;
  website: string;
}

interface HoursForm {
  [day: string]: { open: string; close: string; isOpen: boolean };
}

interface PaymentOptions {
  onlinePayment: boolean;
  cashPayment: boolean;
}

const defaultHours: HoursForm = Object.fromEntries(
  DAYS.map((d) => [d, { open: '09:00', close: '18:00', isOpen: d !== 'sunday' }])
);

export function BusinessProfilePage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [form, setForm] = useState<ProfileForm>({ name: '', description: '', category: '', phone: '', email: '', website: '' });
  const [hours, setHours] = useState<HoursForm>(defaultHours);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions>({ onlinePayment: true, cashPayment: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const biz = await api.getMyBusinesses();
        if (biz.length > 0) {
          const b = biz[0];
          setBusiness(b);
          setForm({
            name: b.name,
            description: b.description,
            category: b.category,
            phone: b.phone ?? '',
            email: b.email ?? '',
            website: b.website ?? '',
          });
          if (b.workingHours) {
            setHours({ ...defaultHours, ...b.workingHours });
          }
          if (b.paymentOptions) {
            setPaymentOptions(b.paymentOptions);
          }
        }
      } catch {
        toast.error('Failed to load business profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSaving(true);
    try {
      const updated = await api.updateBusiness(business._id, {
        name: form.name,
        description: form.description,
        category: form.category as BusinessCategory,
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
      });
      setBusiness(updated);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHours = async () => {
    if (!business) return;
    setIsSavingHours(true);
    try {
      const updated = await api.updateBusiness(business._id, {
        workingHours: hours,
        paymentOptions,
      });
      setBusiness(updated);
      toast.success('Business hours and payment options saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSavingHours(false);
    }
  };

  const updateHours = (day: string, field: 'open' | 'close' | 'isOpen', value: string | boolean) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  if (isLoading) return <LoadingSpinner className="py-20" />;

  if (!business) {
    return (
      <div className="card text-center py-10">
        <p className="text-gray-500">No business found. Please create a business first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
        <p className="text-gray-600 mt-1">Update your business information</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Business Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input-field"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your business..."
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as BusinessCategory })}
            >
              <option value="">Select category</option>
              {Object.values(BusinessCategory).map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input label="Website" type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isSaving}>Save Changes</Button>
          </div>
        </form>
      </div>

      {/* Business Hours */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Hours</h2>
        <div className="space-y-3">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3">
              <div className="w-24">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hours[day]?.isOpen ?? false}
                    onChange={(e) => updateHours(day, 'isOpen', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">{day.slice(0, 3)}</span>
                </label>
              </div>
              {hours[day]?.isOpen ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={hours[day]?.open ?? '09:00'}
                    onChange={(e) => updateHours(day, 'open', e.target.value)}
                    className="input-field flex-1 text-sm"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <input
                    type="time"
                    value={hours[day]?.close ?? '18:00'}
                    onChange={(e) => updateHours(day, 'close', e.target.value)}
                    className="input-field flex-1 text-sm"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400">Closed</span>
              )}
            </div>
          ))}
        </div>

        {/* Payment Options */}
        <div className="mt-6 pt-5 border-t border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Payment Options</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentOptions.onlinePayment}
                onChange={(e) => setPaymentOptions((p) => ({ ...p, onlinePayment: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Online Payment</p>
                <p className="text-xs text-gray-500">Accept payments via UPI, cards, etc.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentOptions.cashPayment}
                onChange={(e) => setPaymentOptions((p) => ({ ...p, cashPayment: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Cash Payment</p>
                <p className="text-xs text-gray-500">Accept cash payments at the venue</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveHours} isLoading={isSavingHours}>Save Hours & Payment Options</Button>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Business Status</h2>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${business.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {business.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${business.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {business.isVerified ? 'Verified' : 'Pending Verification'}
          </span>
        </div>
      </div>
    </div>
  );
}

