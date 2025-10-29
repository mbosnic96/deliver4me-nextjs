"use client";

import Link from "next/link";
import { Truck, MapPin, Star, Eye } from "lucide-react";

interface CarouselItem {
  _id: string;
  title?: string;
  name?: string;
  photoUrl?: string;
  rating?: number;
  city?: string;
  state?: string;
  country?: string;
  pickupCity?: string;
  deliveryCity?: string;
  status?: string;
}

interface CarouselProps {
  title: string;
  items: CarouselItem[];
  isDriver?: boolean;
  isUsers?: boolean;
}

export function Carousel({ title, items, isDriver = false,  isUsers = false }: CarouselProps) {
  if (!items || items.length === 0) return null;
  
  return (
    
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-blue-500 flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600" /> 
          {title}
        </h2>
        <span className="text-sm text-blue-500 px-3 py-1 rounded-full">
          {items.length} {items.length === 1 ? 'stavka' : 'stavke'}
        </span>
      </div>
      
      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 pb-4 min-w-max">
            {items.map((item) => (
              <div 
                key={item._id} 
                className="min-w-[280px] md:min-w-[320px] content-bg rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                <div className="p-4 md:p-6">
                  {isDriver ? (
                    <>
                      <div className="flex items-center gap-4 mb-4">
                        <img 
                          src={item.photoUrl || "/logo.png"} 
                          alt={item.name} 
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-200 transition-colors" 
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-blue-500 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-amber-500 fill-current" />
                            <span className="text-sm font-medium text-white">
                              {item.rating || "N/A"}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-blue-500">Ocjena</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-white flex items-center gap-1 mb-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {[item.city, item.state, item.country].filter(Boolean).join(", ") || "Lokacija nije dostupna"}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-lg text-blue-500 group-hover:text-blue-600 transition-colors mb-3 line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-sm text-white">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="font-medium">Preuzimanje:</span> {item.pickupCity}
                        </p>
                        <p className="flex items-center gap-2 text-sm text-white">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="font-medium">Dostava:</span> {item.deliveryCity}
                        </p>
                      </div>
                      <div className="mt-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === "Aktivan" ? "bg-green-100 text-green-800" :
                          item.status === "Poslan" || item.status === "Sent" ? "bg-blue-100 text-blue-800" :
                          item.status === "Dostavljen" ? "bg-emerald-100 text-emerald-800" :
                          "text-gray-800"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <Link 
                    href={isDriver ? `/users/${item._id}` : `/load/${item._id}`}
                    className="mt-4 w-full px-4 py-2 border border-gray-300 text-white rounded-lg hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 font-medium group/btn"
                  >
                    <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    Detalji
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}