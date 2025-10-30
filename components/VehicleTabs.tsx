"use client";
import React, { useRef } from "react";
import { Package, ArrowRight, ArrowLeft } from "lucide-react";
import { Vehicle } from "@/lib/types/vehicle";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Image from "next/image";

interface VehicleTabsProps {
  vehicles: Vehicle[];
  activeTab: string | null;
  setActiveTab: (id: string) => void;
}

export function VehicleTabs({ vehicles, activeTab, setActiveTab }: VehicleTabsProps) {
  const swiperRefs = useRef<{ [key: string]: any }>({});

  const getVehicleId = (vehicle: Vehicle): string => {
    return vehicle.id || vehicle._id || `temp-${vehicles.indexOf(vehicle)}`;
  };

  const getVehicleImageUrl = (vehicle: Vehicle, imagePath: string) => {
    if (!imagePath) return "/assets/default-vehicle.jpg";
    if (imagePath.startsWith("http") || imagePath.startsWith("data:")) return imagePath;
    const vehicleId = getVehicleId(vehicle);
    return `/uploads/vehicles/${vehicleId}/${imagePath}`;
  };

  const getLoadStatsForVehicle = (vehicle: Vehicle) => {
    const currentLoads = vehicle.currentLoads || [];
    return {
      activeLoads: currentLoads.filter(load => load.status === "active").length,
      deliveredLoads: currentLoads.filter(load => load.status === "delivered").length,
      canceledLoads: currentLoads.filter(load => load.status === "canceled").length,
      totalLoads: currentLoads.length,
      currentVolumeUsed: currentLoads
        .filter(load => load.status === "active")
        .reduce((sum, load) => sum + load.volumeUsed, 0)
    };
  };

  const nextSlide = (vehicleId: string) => {
    swiperRefs.current[vehicleId]?.slideNext();
  };

  const prevSlide = (vehicleId: string) => {
    swiperRefs.current[vehicleId]?.slidePrev();
  };

  return (
    <div className="content-bg rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-4 md:px-6">
            {vehicles.map((v) => (
              <button
                key={v.id}
                className={`pb-4 pt-4 px-4 md:px-6 whitespace-nowrap border-b-3 transition-colors duration-200 font-medium ${
                  activeTab === v.id 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-blue-500 hover:text-white"
                }`}
                onClick={() => setActiveTab(v.id)}
              >
                {v.brand} {v.model}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {vehicles.map(
          (v) =>
            activeTab === v.id && (
              <div key={v.id} className="animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-blue-500 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Slike vozila
                  </h3>

                  {v.images && v.images.length > 0 ? (
                    <div className="relative">
                      <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={16}
                        slidesPerView={1}
                        loop={true}
                        pagination={{ clickable: true }}
                        onSwiper={(swiper) => {
                          swiperRefs.current[getVehicleId(v)] = swiper;
                        }}
                      >
                        {v.images.map((img, index) => {
                          const url = getVehicleImageUrl(v, img);
                          return (
                            <SwiperSlide key={index}>
                              <div className="relative rounded-xl overflow-hidden shadow-lg h-64">
                                <img
                                  src={url}
                                  alt={`${v.brand} ${v.model} - Slika ${index + 1}`}
                                  className="object-contain"
                                />
                                <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                                  {index + 1} / {v.images.length}
                                </div>
                              </div>
                            </SwiperSlide>
                          );
                        })}
                      </Swiper>

                      {v.images.length > 1 && (
                        <div className="absolute top-1/2 left-0 right-0 flex justify-between px-2 -translate-y-1/2 pointer-events-none z-10">
                          <button
                            onClick={() => prevSlide(getVehicleId(v))}
                            className="pointer-events-auto bg-black/60 hover:bg-black/80 p-2 rounded-full text-white transition-all"
                          >
                            <ArrowLeft size={18} />
                          </button>
                          <button
                            onClick={() => nextSlide(getVehicleId(v))}
                            className="pointer-events-auto bg-black/60 hover:bg-black/80 p-2 rounded-full text-white transition-all"
                          >
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-800 rounded-xl border-2 border-dashed border-gray-600">
                      <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Nema dostupnih slika za ovo vozilo</p>
                      <p className="text-gray-500 text-sm mt-2">Dodajte slike za bolji pregled vozila</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col lg:items-center gap-6 mb-8">
                  <div className="relative w-64 h-48 mx-auto lg:mx-0">
                    <img 
                      src="/minitruck.png" 
                      alt="truck" 
                      className="w-full h-full object-contain" 
                    />
                    <div className="absolute -bottom-2 left-0 right-0">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${v.cargoPercentage || 0}%` }}
                        ></div>
                      </div>
                      <p className="text-center text-sm font-medium text-white mt-2">
                        {v.cargoPercentage || 0}% popunjeno
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-blue-500 font-medium">Model</label>
                        <p className="text-white">{v.brand} {v.model}</p>
                      </div>
                      <div>
                        <label className="text-sm text-blue-500 font-medium">Registracija</label>
                        <p className="text-white">{v.plateNumber || "N/A"}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-blue-500 font-medium">Dimenzije (š×v×d)</label>
                        <p className="text-white">
                          {v.width || 0} × {v.height || 0} × {v.length || 0} cm
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-blue-500 font-medium">Ukupni kapacitet</label>
                        <p className="text-white">{v.volume || 0} m³</p>
                      </div>
                    </div>
                  </div>
                </div>
</div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-blue-500 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Statistika tereta
                  </h3>

                  {v.currentLoads && v.currentLoads.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-gray-800 rounded-lg p-4">
                          <h4 className="font-medium text-white mb-3">Trenutno iskorištenje</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300">Iskorišten volumen:</span>
                              <span className="text-white font-medium">
                                {getLoadStatsForVehicle(v).currentVolumeUsed}m³ / {v.volume || 0}m³
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${v.cargoPercentage || 0}%` }}
                              ></div>
                            </div>
                            <div className="text-right text-sm text-gray-300">
                              {v.cargoPercentage?.toFixed(1)}% popunjeno
                            </div>
                          </div>
                        </div>
                        {getLoadStatsForVehicle(v).activeLoads > 0 && (
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="font-medium text-white mb-3">Trenutni aktivni tereti</h4>
                            <div className="space-y-3">
                              {v.currentLoads
                                .filter(load => load.status === "active")
                                .map((load, index) => (
                                  <div key={load._id?.$oid || index} className="flex flex-col py-3 px-3 bg-gray-700 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="font-medium text-sm text-white">{load.title}</span>
                                      </div>
                                      <span className="text-green-400 font-medium text-sm">{load.volumeUsed}m³</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-300 items-center">
                                      <span>{load.pickupCity} <ArrowRight size={12} className="inline text-blue-500" /> {load.deliveryCity}</span>
                                      <span>{load.fixedPrice} BAM</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-3">Istorija tereta</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {v.currentLoads
                            .slice()
                            .sort((a, b) => {
                              const statusOrder = { active: 0, delivered: 1, canceled: 2 };
                              return statusOrder[a.status] - statusOrder[b.status];
                            })
                            .map((load, index) => {
                              const statusColors = {
                                active: "text-blue-400",
                                delivered: "text-green-400", 
                                canceled: "text-red-400"
                              };
                              const statusLabels = {
                                active: "Aktivan",
                                delivered: "Dostavljen",
                                canceled: "Otkazan"
                              };
                              return (
                                <div key={load._id?.$oid || index} className="flex justify-between items-center py-2 px-3 bg-gray-700 rounded text-sm">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${
                                        load.status === 'active' ? 'bg-blue-400' :
                                        load.status === 'delivered' ? 'bg-green-400' : 'bg-red-400'
                                      }`}></span>
                                      <span className="text-white truncate">{load.title}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                      {load.pickupCity} <ArrowRight size={12} className="text-blue-500" /> {load.deliveryCity}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-xs font-medium ${statusColors[load.status]}`}>
                                      {statusLabels[load.status]}
                                    </div>
                                    <div className="text-xs text-gray-300">{load.volumeUsed}m³</div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-400">Nema podataka o teretima za ovo vozilo</p>
                    </div>
                  )}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}
