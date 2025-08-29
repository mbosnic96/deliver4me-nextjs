"use client";

import { useEffect, useState } from "react";
import { Review } from "@/lib/types/review";
import { FullUserDto } from "@/lib/types/user";

interface ReviewsListProps {
  userId: string;
}

export default function ReviewsList({ userId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${userId}/reviews`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data: Review[] = await res.json();
        setReviews(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [userId]);

  if (loading) return <p className="text-center py-4">Loading reviews...</p>;
  if (reviews.length === 0) return <p className="text-center py-4">No reviews yet.</p>;

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex flex-col"
        >
          <div className="flex justify-between items-center mb-2">
            <strong>Rating: {review.rating} ⭐</strong>
            <span className="text-gray-400 text-sm">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          {review.comment && <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>}
        </div>
      ))}
    </div>
  );
}
