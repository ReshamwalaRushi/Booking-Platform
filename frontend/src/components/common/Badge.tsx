import React from 'react';
import { BookingStatus } from '../../types';

interface BadgeProps {
  status: BookingStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-800' },
  no_show: { label: 'No Show', className: 'bg-gray-100 text-gray-800' },
};

export function Badge({ status, className = '' }: BadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}
