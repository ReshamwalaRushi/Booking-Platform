import React from 'react';
import { Service } from '../../types';
import { Button } from '../common/Button';

interface ServiceCardProps {
  service: Service;
  onBook?: (service: Service) => void;
}

export function ServiceCard({ service, onBook }: ServiceCardProps) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{service.name}</h4>
          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {service.duration} min
            </span>
            {service.requiresZoom && (
              <span className="flex items-center gap-1 text-primary-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10l4-2v8l-4-2v-4zm-1 7H3a1 1 0 01-1-1V8a1 1 0 011-1h13a1 1 0 011 1v8a1 1 0 01-1 1z" />
                </svg>
                Online
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-gray-900">
            {service.currency} {(service.price / 100).toFixed(2)}
          </p>
          {onBook && (
            <Button size="sm" className="mt-2" onClick={() => onBook(service)}>
              Book Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
