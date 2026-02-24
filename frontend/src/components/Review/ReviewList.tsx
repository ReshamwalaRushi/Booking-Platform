import React from 'react';
import { Review, User } from '../../types';

interface ReviewListProps {
  reviews: Review[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(rating)}
      {'☆'.repeat(5 - rating)}
    </span>
  );
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="text-gray-500 text-sm py-4 text-center">No reviews yet. Be the first to review!</p>;
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => {
        const client = review.clientId as User | undefined;
        const clientName = client ? `${client.firstName} ${client.lastName}` : 'Anonymous';
        return (
          <li key={review._id} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-semibold text-primary-700">
                  {clientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{clientName}</p>
                  <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <StarRating rating={review.rating} />
            </div>
            {review.comment && (
              <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
            )}
            {review.response && (
              <div className="mt-3 pl-4 border-l-2 border-primary-200">
                <p className="text-xs font-medium text-primary-700 mb-1">Business Response</p>
                <p className="text-sm text-gray-600">{review.response.text}</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
