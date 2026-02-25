import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Business } from '../../types';
import { format } from 'date-fns';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
}

interface NotifPrefs {
  email: boolean;
  sms: boolean;
  bookingConfirmation: boolean;
  bookingReminder: boolean;
  cancellation: boolean;
  promotions: boolean;
}

const NOTIF_KEY = 'bookease_notif_prefs';

function loadPrefs(): NotifPrefs {
  try {
    const stored = localStorage.getItem(NOTIF_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { email: true, sms: false, bookingConfirmation: true, bookingReminder: true, cancellation: true, promotions: false };
}

export function ClientProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileForm>({ firstName: '', lastName: '', phone: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs());
  const [favorites, setFavorites] = useState<Business[]>([]);
  const [memberSince, setMemberSince] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const me = await api.getMe();
        setForm({ firstName: me.firstName, lastName: me.lastName, phone: me.phone ?? '' });
        if (me.createdAt) setMemberSince(format(new Date(me.createdAt), 'MMMM yyyy'));
      } catch {
        if (user) {
          setForm({ firstName: user.firstName, lastName: user.lastName, phone: '' });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Load favorite businesses (stored locally)
  useEffect(() => {
    const stored = localStorage.getItem('bookease_favorites');
    if (stored) {
      try {
        const ids: string[] = JSON.parse(stored);
        if (ids.length > 0) {
          api.getBusinesses().then((all) => {
            setFavorites(all.filter((b) => ids.includes(b._id)));
          }).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateMe({ firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined });
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePref = (key: keyof NotifPrefs, val: boolean) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    toast.success('Preference saved');
  };

  const removeFavorite = (id: string) => {
    const stored = localStorage.getItem('bookease_favorites');
    const ids: string[] = stored ? JSON.parse(stored) : [];
    const updated = ids.filter((i) => i !== id);
    localStorage.setItem('bookease_favorites', JSON.stringify(updated));
    setFavorites((prev) => prev.filter((b) => b._id !== id));
    toast.success('Removed from favorites');
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${value ? 'bg-indigo-600' : 'bg-gray-300'}`}
      style={!value ? { background: 'var(--border)' } : {}}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Profile</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your personal information and preferences</p>
      </div>

      {/* Personal Info */}
      <div className="card mb-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {form.firstName.charAt(0)}{form.lastName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{form.firstName} {form.lastName}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            {memberSince && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Member since {memberSince}</p>}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last Name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-000-0000" />
          <Input label="Email" type="email" value={user?.email ?? ''} disabled helperText="Email cannot be changed" />
          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isSaving}>Save Changes</Button>
          </div>
        </form>
      </div>

      {/* Saved Payment Methods */}
      <div className="card mb-5">
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>💳 Saved Payment Methods</h2>
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(99,102,241,.06)', border: '1px dashed rgba(99,102,241,.3)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: 'rgba(99,102,241,.12)' }}>➕</div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Add a payment method</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cards will be saved securely via Razorpay</p>
          </div>
          <Button size="sm" variant="secondary" className="ml-auto" onClick={() => toast.success('Redirecting to Razorpay saved cards...')}>Add Card</Button>
        </div>
      </div>

      {/* Favorite Businesses */}
      <div className="card mb-5">
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>❤️ Favorite Businesses</h2>
        {favorites.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🏢</div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No favorites yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Browse businesses and click the heart icon to save them</p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((biz) => (
              <div key={biz._id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,.04)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {biz.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{biz.name}</p>
                  <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{biz.category}</p>
                </div>
                <button
                  onClick={() => removeFavorite(biz._id)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                  title="Remove from favorites"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="card">
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>🔔 Notification Preferences</h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Saved locally — will sync with backend when available.</p>
        <div className="space-y-4">
          {([
            { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
            { key: 'sms', label: 'SMS Notifications', desc: 'Receive text message reminders' },
            { key: 'bookingConfirmation', label: 'Booking Confirmation', desc: 'Notify when a booking is confirmed' },
            { key: 'bookingReminder', label: 'Appointment Reminder', desc: 'Get reminded 24h before your appointment' },
            { key: 'cancellation', label: 'Cancellation Alerts', desc: 'Notify when a booking is cancelled' },
            { key: 'promotions', label: 'Promotions & Offers', desc: 'Receive deals from businesses you follow' },
          ] as { key: keyof NotifPrefs; label: string; desc: string }[]).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </div>
              <Toggle value={prefs[key]} onChange={(v) => updatePref(key, v)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
