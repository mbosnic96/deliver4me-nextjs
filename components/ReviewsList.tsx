"use client";

import { useEffect, useState } from "react";
import { Review } from "@/lib/types/review";
import { Star, Calendar, User, MessageSquare, Loader2 } from "lucide-react";

interface ReviewsListProps {
  userId: string;
}

export default function ReviewsList({ userId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{[key: string]: string}>({});

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/users/${userId}/reviews`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data: Review[] = await res.json();
        setReviews(data);

      
        const userIds = Array.from(new Set(data.map(review => review.fromUserId)));
        const userPromises = userIds.map(id => 
          fetch(`/api/users/${id}`).then(res => res.ok ? res.json() : null)
        );
        
        const usersData = await Promise.all(userPromises);
        const usersMap: {[key: string]: string} = {};
        usersData.forEach((user, index) => {
          if (user) {
            usersMap[userIds[index]] = user.name;
          }
        });
        setUsers(usersMap);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [userId]);

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }
      />
    ));
  };

  if (loading) {
    return (
      <div className="content-bg rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="content-bg rounded-xl shadow-sm border p-6">
        <div className="text-center py-8">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nema recenzija</h3>
          <p className="text-gray-600">Ovaj korisnik još nema recenzija.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-bg rounded-xl shadow-sm border p-6">
      <h3 className="font-semibold text-white mb-6 flex items-center">
        <MessageSquare size={20} className="mr-2 text-blue-600" />
        Recenzije ({reviews.length})
      </h3>
      
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    {users[review.fromUserId] || "Anoniman korisnik"}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                    <span className="text-sm font-medium text-gray-600">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-white">
                <Calendar size={14} className="mr-1 text-blue-600" />
                {new Date(review.createdAt).toLocaleDateString('bs-BA')}
              </div>
            </div>

            {review.comment && (
              <div className="pl-13">
                <p className="text-white leading-relaxed">{review.comment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}