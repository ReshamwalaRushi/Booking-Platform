import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { UserRole } from '../../types';
import api from '../../services/api';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: UserRole.CLIENT,
  });
  const [businessDetails, setBusinessDetails] = useState({
    businessName: '',
    businessWebsite: '',
    businessDescription: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const updateBusiness = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setBusinessDetails((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email address';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Minimum 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(form);
      if (form.role === UserRole.BUSINESS_OWNER && businessDetails.businessName.trim()) {
        try {
          await api.createBusiness({
            name: businessDetails.businessName.trim(),
            description: businessDetails.businessDescription.trim() || undefined,
            website: businessDetails.businessWebsite.trim() || undefined,
            address: {
              street: businessDetails.street.trim() || '',
              city: businessDetails.city.trim() || '',
              state: businessDetails.state.trim() || '',
              zipCode: businessDetails.zip.trim() || '',
              country: 'US',
            },
          } as any);
          toast.success('Account and business profile created!');
        } catch {
          toast.success('Account created! Add business details in your dashboard.');
        }
      } else {
        toast.success('Account created successfully!');
      }
      navigate(form.role === UserRole.BUSINESS_OWNER ? '/business/dashboard' : '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-600 mt-2">Join BookEase today</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Input label="First name" value={form.firstName} onChange={update('firstName')} error={errors.firstName} placeholder="John" required />
              <Input label="Last name" value={form.lastName} onChange={update('lastName')} error={errors.lastName} placeholder="Doe" required />
            </div>
            <Input label="Email address" type="email" value={form.email} onChange={update('email')} error={errors.email} placeholder="john@example.com" required />
            <Input label="Password" type="password" value={form.password} onChange={update('password')} error={errors.password} placeholder="Min. 8 characters" helperText="At least 8 characters" required />
            <Input label="Phone (optional)" type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 234 567 8900" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
              <select value={form.role} onChange={update('role')} className="input-field">
                <option value={UserRole.CLIENT}>Client (looking to book)</option>
                <option value={UserRole.BUSINESS_OWNER}>Business Owner (offering services)</option>
              </select>
            </div>

            {form.role === UserRole.BUSINESS_OWNER && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Business Details</p>
                  <p className="text-xs text-gray-400 mt-0.5">Saved for your business profile setup in the dashboard</p>
                </div>
                <Input
                  label="Business Name"
                  value={businessDetails.businessName}
                  onChange={updateBusiness('businessName')}
                  placeholder="Acme Salon"
                />
                <Input
                  label="Business Website (optional)"
                  type="url"
                  value={businessDetails.businessWebsite}
                  onChange={updateBusiness('businessWebsite')}
                  placeholder="https://yoursite.com"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                  <textarea
                    value={businessDetails.businessDescription}
                    onChange={updateBusiness('businessDescription')}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Briefly describe your business…"
                  />
                </div>
                <p className="text-sm font-semibold text-gray-700">Address</p>
                <Input
                  label="Street"
                  value={businessDetails.street}
                  onChange={updateBusiness('street')}
                  placeholder="123 Main St"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="City"
                    value={businessDetails.city}
                    onChange={updateBusiness('city')}
                    placeholder="San Francisco"
                  />
                  <Input
                    label="State"
                    value={businessDetails.state}
                    onChange={updateBusiness('state')}
                    placeholder="CA"
                  />
                </div>
                <Input
                  label="ZIP Code"
                  value={businessDetails.zip}
                  onChange={updateBusiness('zip')}
                  placeholder="94107"
                />
              </div>
            )}
            <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
              Create Account
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
