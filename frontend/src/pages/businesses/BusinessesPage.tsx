import React, { useState, useEffect } from 'react';
import { Business, BusinessCategory } from '../../types';
import api from '../../services/api';
import { BusinessList } from '../../components/Business/BusinessList';

export function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true);
      try {
        const data = await api.getBusinesses(category || undefined);
        setBusinesses(data);
      } catch {
        setBusinesses([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBusinesses();
  }, [category]);

  const filtered = search
    ? businesses.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.description.toLowerCase().includes(search.toLowerCase()))
    : businesses;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
        <p className="text-gray-600 mt-1">Find the perfect service provider</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search businesses..."
            className="input-field"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field sm:w-48">
          <option value="">All Categories</option>
          {Object.values(BusinessCategory).map((cat) => (
            <option key={cat} value={cat} className="capitalize">{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>

      <BusinessList businesses={filtered} isLoading={isLoading} />
    </div>
  );
}
