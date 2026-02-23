import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Business, Service } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface ServiceForm {
  name: string;
  description: string;
  duration: string;
  price: string;
}

const emptyForm: ServiceForm = { name: '', description: '', duration: '', price: '' };

export function BusinessServicesPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const biz = await api.getMyBusinesses();
        if (biz.length > 0) {
          setBusiness(biz[0]);
          const svcs = await api.getServices(biz[0]._id);
          setServices(svcs);
        }
      } catch {
        toast.error('Failed to load services');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const openAdd = () => {
    setEditService(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditService(s);
    setForm({ name: s.name, description: s.description, duration: String(s.duration), price: String(s.price) });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        duration: Number(form.duration),
        price: Number(form.price),
      };
      if (editService) {
        const updated = await api.updateService(editService._id, payload);
        setServices((prev) => prev.map((s) => (s._id === editService._id ? updated : s)));
        toast.success('Service updated');
      } else {
        const created = await api.createService({ ...payload, businessId: business._id });
        setServices((prev) => [...prev, created]);
        toast.success('Service created');
      }
      setModalOpen(false);
    } catch {
      toast.error('Failed to save service');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await api.deleteService(id);
      setServices((prev) => prev.filter((s) => s._id !== id));
      toast.success('Service deleted');
    } catch {
      toast.error('Failed to delete service');
    }
  };

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage your business services</p>
        </div>
        <Button onClick={openAdd}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-500 mb-4">No services yet</p>
          <Button onClick={openAdd} size="sm">Add your first service</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s._id} className="card">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{s.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>⏱ {s.duration} min</span>
                <span>💵 ${s.price}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(s)} className="flex-1">Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(s._id)} className="flex-1">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editService ? 'Edit Service' : 'Add Service'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Haircut" />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input-field"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the service"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (minutes)" type="number" required min="1" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="60" />
            <Input label="Price ($)" type="number" required min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="50" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>{editService ? 'Save Changes' : 'Create Service'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
