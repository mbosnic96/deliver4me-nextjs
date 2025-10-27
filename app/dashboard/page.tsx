"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Truck, Plane, CheckCircle, Ban, Users, MapPin, Star, Eye, Plus } from "lucide-react";
import dynamic from 'next/dynamic';

const AllRoutesMap = dynamic(() => import('@/components/AllRoutesMap').then(mod => mod.AllRoutesMap), {
  ssr: false,
  loading: () => (
    <div className="h-80 rounded-xl flex items-center justify-center animate-pulse">
      <div className="text-center">
        <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-3"></div>
        <p className="text-white">Učitavanje mape...</p>
      </div>
    </div>
  )
});


interface Load {
  id: string;
  title: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress?: string;
  pickupCity: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryAddress?: string;
  deliveryCity: string;
  status: string;
}

interface Vehicle {
  id: string;
  model: string;
  cargoPercentage?: number;
  plateNumber?: string;
  width?: number;
  height?: number;
  length?: number;
  lat?: number;
  lng?: number;
}

interface Driver {
  id: string;
  name: string;
  photoUrl?: string;
  rating?: number;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [loads, setLoads] = useState<Load[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalLoads: 0,
    activeLoads: 0,
    sentLoads: 0,
    deliveredLoads: 0,
    canceledLoads: 0,
    totalVehicles: 0,
    rating: 0,
    userCount: 0,
  });

  
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        //loads
        const loadRes = await fetch(`/api/loads?limit=50`);
        const loadData = await loadRes.json();
        setLoads(loadData.data || []);

        // vehicles
        if (role === "driver") {
          const vehicleRes = await fetch(`/api/vehicles`);
          const vehicleData = await vehicleRes.json();
          const vehiclesData = vehicleData.data || [];
          setVehicles(vehiclesData);
          if (vehiclesData[0]?.id) setActiveTab(vehiclesData[0].id);
        }

        // User stats 
        const userRes = await fetch(`/api/users/me`);
        const userData = await userRes.json();

        if (role === "admin") {
          setStats({
            totalLoads: loadData.total || 0,
            activeLoads: loadData.data?.filter((l: Load) => l.status === "Aktivan").length || 0,
            sentLoads: loadData.data?.filter((l: Load) => l.status === "Poslan" || l.status === "Sent").length || 0,
            deliveredLoads: loadData.data?.filter((l: Load) => l.status === "Dostavljen").length || 0,
            canceledLoads: loadData.data?.filter((l: Load) => l.status === "Otkazan").length || 0,
            userCount: userData.totalUsers || 0,
            totalVehicles: 0,
            rating: 0,
          });
        } else {
          setStats((s) => ({
            ...s,
            totalLoads: loadData.total || 0,
            rating: userData.rating || 0,
          }));
        }

      
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id, role]);

  const sentLoads = loads.filter(load => 
    load.status === "Poslan" || load.status === "Sent"
  );

  // Convert sent loads for map component with validation
  const mapLoads = sentLoads
    .filter(load => {
      const isValid = 
        load.pickupLatitude && load.pickupLongitude && 
        load.deliveryLatitude && load.deliveryLongitude &&
        !isNaN(load.pickupLatitude) && !isNaN(load.pickupLongitude) &&
        !isNaN(load.deliveryLatitude) && !isNaN(load.deliveryLongitude) &&
        Math.abs(load.pickupLatitude) <= 90 && Math.abs(load.pickupLongitude) <= 180 &&
        Math.abs(load.deliveryLatitude) <= 90 && Math.abs(load.deliveryLongitude) <= 180;
      
      if (!isValid) {
        console.warn('Invalid coordinates for load:', load.id);
      }
      return isValid;
    })
    .map(load => ({
      id: load.id,
      title: load.title,
      pickup: { 
        lat: load.pickupLatitude,
        lng: load.pickupLongitude,
        address: load.pickupAddress 
      },
      delivery: { 
        lat: load.deliveryLatitude,
        lng: load.deliveryLongitude,
        address: load.deliveryAddress 
      },
    }));



  const getCarouselLoads = () => {
    switch (role) {
      case "driver":
        return loads.filter(load => load.status === "Poslan" || load.status === "Sent");
      case "client":
        return loads.filter(load => load.status === "Poslan" || load.status === "Sent");
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="content-bg  rounded-xl p-6 shadow-sm h-32"></div>
              ))}
            </div>
            <div className="content-bg  rounded-xl p-6 shadow-sm h-80 mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-500 mb-2">
              Dobrodošli, {session?.user?.name || 'Korisniče'}!
            </h1>
            <p className="text-white">Pregledajte stanje vaših dostava i aktivnosti</p>
          </div>
        </div>

        {role === "admin" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <StatCard 
              title="Ukupno dostava" 
              value={stats.totalLoads} 
              icon={<Truck className="w-6 h-6" />} 
              gradient="from-blue-500 to-blue-600"
            />
            <StatCard 
              title="Aktivne dostave" 
              value={stats.activeLoads} 
              icon={<Truck className="w-6 h-6" />} 
              gradient="from-green-500 to-green-600"
            />
            <StatCard 
              title="Poslano" 
              value={stats.sentLoads} 
              icon={<Plane className="w-6 h-6" />} 
              gradient="from-orange-500 to-orange-600"
            />
            <StatCard 
              title="Dostavljeno" 
              value={stats.deliveredLoads} 
              icon={<CheckCircle className="w-6 h-6" />} 
              gradient="from-emerald-500 to-emerald-600"
            />
            <StatCard 
              title="Otkazano" 
              value={stats.canceledLoads} 
              icon={<Ban className="w-6 h-6" />} 
              gradient="from-red-500 to-red-600"
            />
            <StatCard 
              title="Broj korisnika" 
              value={stats.userCount} 
              icon={<Users className="w-6 h-6" />} 
              gradient="from-purple-500 to-purple-600"
            />
          </div>
        )}

        {mapLoads.length > 0 && (
          <div className="mb-6 md:mb-8">
            <div className="content-bg  rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-semibold text-blue-500 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Mapa poslanih dostava
                  </h2>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {mapLoads.length} dostava
                  </span>
                </div>
              </div>
              <div className="h-80 md:h-96">
                <AllRoutesMap loads={mapLoads} />
              </div>
            </div>
          </div>
        )}

        {sentLoads.length === 0 && loads.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 md:p-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 text-yellow-600 mt-0.5">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-yellow-800 font-medium mb-1">Nema aktivnih dostava</h3>
                <p className="text-yellow-700 text-sm">
                  Trenutno nema dostava sa statusom "Poslano" ili "Sent" za prikaz na mapi.
                </p>
              </div>
            </div>
          </div>
        )}

        {sentLoads.length > 0 && mapLoads.length === 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 md:p-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 text-red-600 mt-0.5">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-red-800 font-medium mb-1">Problem s koordinatama</h3>
                <p className="text-red-700 text-sm">
                  Dostave sa statusom "Poslano" postoje, ali nemaju validne koordinate za prikaz na mapi.
                </p>
              </div>
            </div>
          </div>
        )}

        {role === "driver" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <StatCard 
                title="Ukupno dostava" 
                value={stats.totalLoads} 
                icon={<Truck className="w-6 h-6" />} 
                gradient="from-blue-500 to-blue-600"
              />
              <StatCard 
                title="Moja vozila" 
                value={vehicles.length} 
                icon={<Truck className="w-6 h-6" />} 
                gradient="from-green-500 to-green-600"
              />
              <StatCard 
                title="Ocjena" 
                value={stats.rating} 
                icon={<Star className="w-6 h-6" />} 
                gradient="from-amber-500 to-amber-600"
                isRating={true}
              />
            </div>
            
            <Carousel 
              title="Aktivne dostave" 
              items={getCarouselLoads()} 
            />
            
            {vehicles.length > 0 && (
              <div className="mb-6 md:mb-8">
                <VehicleTabs 
                  vehicles={vehicles} 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                />
              </div>
            )}
          </>
        )}

        {role === "client" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              <StatCard 
                title="Ukupno dostava" 
                value={stats.totalLoads} 
                icon={<Truck className="w-6 h-6" />} 
                gradient="from-blue-500 to-blue-600"
              />
              <StatCard 
                title="Ocjena" 
                value={stats.rating} 
                icon={<Star className="w-6 h-6" />} 
                gradient="from-amber-500 to-amber-600"
                isRating={true}
              />
            </div>
            
            <Carousel title="Moje dostave" items={getCarouselLoads()} />
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  gradient,
  isRating = false 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  gradient: string;
  isRating?: boolean;
}) {
  return (
    <div className="content-bg  rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h6 className="text-white text-sm font-medium mb-1">{title}</h6>
          <h3 className="font-bold text-2xl md:text-3xl text-blue-500 group-hover:text-gray-800 transition-colors">
            {isRating && typeof value === 'number' ? value.toFixed(1) : value}
            {isRating && <span className="text-lg text-blue-500">/5</span>}
          </h3>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} text-white shadow-sm group-hover:scale-105 transition-transform duration-200`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface CarouselProps {
  title: string;
  items: any[];
  isDriver?: boolean;
}

function Carousel({ title, items, isDriver = false }: CarouselProps) {
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
                key={item.id} 
                className="min-w-[280px] md:min-w-[320px] content-bg  rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden group"
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
                  
                  <button className="mt-4 w-full px-4 py-2 border border-gray-300 text-white rounded-lg hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 font-medium group/btn">
                    <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    Detalji
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface VehicleTabsProps {
  vehicles: Vehicle[];
  activeTab: string | null;
  setActiveTab: (id: string) => void;
}

function VehicleTabs({ vehicles, activeTab, setActiveTab }: VehicleTabsProps) {
  return (
    <div className="content-bg  rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-4 md:px-6">
            {vehicles.map((v) => (
              <button
                key={v.id}
                className={`pb-4 px-4 md:px-6 whitespace-nowrap border-b-2 transition-colors duration-200 font-medium ${
                  activeTab === v.id 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-blue-500 hover:text-white"
                }`}
                onClick={() => setActiveTab(v.id)}
              >
                {v.model || "Unnamed Vehicle"}
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
                <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-6">
                  <div className="relative w-32 h-32 mx-auto lg:mx-0">
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
                        <p className="text-white">{v.model || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm text-blue-500 font-medium">Registracija</label>
                        <p className="text-white">{v.plateNumber || "N/A"}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-blue-500 font-medium">Dimenzije (š×v×d)</label>
                      <p className="text-white">
                        {v.width || 0} × {v.height || 0} × {v.length || 0} cm
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}