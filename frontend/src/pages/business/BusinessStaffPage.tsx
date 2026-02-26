import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Business } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const STAFF_LIMIT = 5;

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
}

interface StaffForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bio: string;
}

const emptyForm: StaffForm = { firstName: '', lastName: '', email: '', phoneNumber: '', bio: '' };

export function BusinessStaffPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const biz = await api.getMyBusinesses();
        if (biz.length > 0) {
          setBusiness(biz[0]);
          const members = await api.getStaff(biz[0]._id);
          setStaff(members as StaffMember[]);
        }
      } catch {
        toast.error('Failed to load staff');
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
      const created = await api.createStaff({ ...form, businessId: business._id });
      setStaff((prev) => [...prev, created as StaffMember]);
      toast.success('Staff member added');
      setModalOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add staff member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      await api.deleteStaff(id);
      setStaff((prev) => prev.filter((s) => s._id !== id));
      toast.success('Staff member removed');
    } catch {
      toast.error('Failed to remove staff member');
    }
  };

  const isAtLimit = staff.length >= STAFF_LIMIT;

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">Manage your team members</p>
        </div>
        <Button
          onClick={() => { setForm(emptyForm); setModalOpen(true); }}
          disabled={isAtLimit}
          title={isAtLimit ? `Free plan allows up to ${STAFF_LIMIT} staff members` : undefined}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </Button>
      </div>

      {/* Staff count progress */}
      <div className="mb-6 p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Staff Members ({staff.length} / {STAFF_LIMIT})
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,.1)', color: '#6366f1' }}>
            Free Plan
          </span>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: 'rgba(99,102,241,.15)' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${(staff.length / STAFF_LIMIT) * 100}%`,
              background: isAtLimit ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            }}
          />
        </div>
        {isAtLimit && (
          <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
            ⚠️ Staff limit reached. Upgrade your plan to add more staff members.
          </p>
        )}
      </div>

      {staff.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-500 mb-4">No staff members yet</p>
          <Button size="sm" onClick={() => setModalOpen(true)}>Add first staff member</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div key={s._id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {s.firstName.charAt(0)}{s.lastName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>
              </div>
              {s.phoneNumber && <p className="text-sm text-gray-600 mb-2">📞 {s.phoneNumber}</p>}
              {s.bio && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{s.bio}</p>}
              <Button size="sm" variant="danger" fullWidth onClick={() => handleDelete(s._id)}>Remove</Button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff Member">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last Name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone Number" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea className="input-field" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Short bio (optional)" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>Add Staff</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
