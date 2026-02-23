import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Business, BusinessCategory } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface ProfileForm {
  name: string;
  description: string;
  category: BusinessCategory | '';
  phone: string;
  email: string;
  website: string;
}

export function BusinessProfilePage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>({ name: '', description: '', category: '', phone: '', email: '', website: '' });

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
