"use client";

import { FaStar } from "react-icons/fa";

interface RatingsCardProps {
  averageRating: number;
  totalReviews: number;
}

export default function RatingsCard({ averageRating, totalReviews }: RatingsCardProps) {
  return (
    <div className="bg-gray-800 text-white rounded-3xl shadow-sm p-4 h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h6 className="text-gray-300 mb-1">Ocjena</h6>
          <h4 className="text-xl font-bold">{averageRating.toFixed(1)}</h4>
        </div>
        <div className="rounded-full p-2 bg-yellow-400 text-gray-800">
          <FaStar className="text-lg" />
        </div>
      </div>
      <small className="text-gray-400">{totalReviews} recenzija</small>
    </div>
  );
}
