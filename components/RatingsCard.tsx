"use client";

import { Star } from "lucide-react";

interface RatingsCardProps {
  averageRating: number;
  totalReviews: number;
}

export default function RatingsCard({ averageRating, totalReviews }: RatingsCardProps) {
  return (
    <div className="content-bg rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white mb-2">Ocjena korisnika</h3>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={
                  i < Math.floor(averageRating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }
              />
            ))}
            <span className="text-2xl font-bold text-white ml-2">
              {averageRating.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="rounded-full p-3 bg-yellow-100 text-yellow-600">
          <Star size={20} className="fill-current" />
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <span className="font-medium">{totalReviews}</span> 
        {totalReviews === 1 ? ' recenzija' : 
         totalReviews >= 2 && totalReviews <= 4 ? ' recenzije' : 
         ' recenzija'}
      </div>
      
      {totalReviews === 0 && (
        <div className="mt-3 text-sm text-gray-500">
          Još nema recenzija za ovog korisnika
        </div>
      )}
    </div>
  );
}