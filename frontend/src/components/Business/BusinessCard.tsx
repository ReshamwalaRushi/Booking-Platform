import React from 'react';
import { Link } from 'react-router-dom';
import { Business } from '../../types';

interface BusinessCardProps {
  business: Business;
  onSelect?: (business: Business) => void;
}

const categoryIcons: Record<string, string> = {
  salon: '✂️',
  clinic: '🏥',
  consultant: '💼',
  fitness: '💪',
  spa: '🧘',
  dental: '🦷',
  veterinary: '🐾',
  other: '🏢',
};

export function BusinessCard({ business, onSelect }: BusinessCardProps) {
  const cardContent = (
    <div className="card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(99,102,241,.12)' }}>
          {categoryIcons[business.category] || '🏢'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{business.name}</h3>
            {business.isVerified && (
              <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-sm capitalize mt-0.5" style={{ color: 'var(--text-secondary)' }}>{business.category}</p>
          <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{business.description}</p>
          {business.address?.city && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {business.address.city}, {business.address.state}
            </p>
          )}
          {business.rating > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400">★</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{business.rating.toFixed(1)}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({business.totalReviews} reviews)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <div onClick={() => onSelect(business)} className="block">
        {cardContent}
      </div>
    );
  }

  return (
    <Link to={`/businesses/${business._id}`} className="block">
      {cardContent}
    </Link>
  );
}
