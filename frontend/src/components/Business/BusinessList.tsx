import React from 'react';
import { Business } from '../../types';
import { BusinessCard } from './BusinessCard';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface BusinessListProps {
  businesses: Business[];
  isLoading: boolean;
}

export function BusinessList({ businesses, isLoading }: BusinessListProps) {
  if (isLoading) return <LoadingSpinner className="py-12" />;
  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p className="text-gray-500">No businesses found</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {businesses.map((b) => <BusinessCard key={b._id} business={b} />)}
    </div>
  );
}
