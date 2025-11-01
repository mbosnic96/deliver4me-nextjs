"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Truck, Plane, CheckCircle, Ban, Users, MapPin, Star, Eye, Plus, User, TrendingUp, Calendar, Package, DollarSign } from "lucide-react";
import dynamic from 'next/dynamic';
import { Carousel } from "@/components/Carousel";
import { VehicleTabs } from "@/components/VehicleTabs";
import Sidebar from "@/components/Sidebar";
import { Vehicle } from "@/lib/types/vehicle";

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

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  photoUrl?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface Load {
  _id: string;
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
  fixedPrice?: number;
  createdAt: string;
}



interface Statistics {
  monthlyRevenue: number;
  newUsersThisMonth: number;
  loadsThisMonth: number;
  userGrowth: number;
  revenueGrowth: number;
  loadGrowth: number;
  totalRevenue: number;
  activeLoads: number;
  completedLoads: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as "client" | "driver" | "admin" | undefined;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [loads, setLoads] = useState<Load[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics>({
    monthlyRevenue: 0,
    newUsersThisMonth: 0,
    loadsThisMonth: 0,
    userGrowth: 0,
    revenueGrowth: 0,
    loadGrowth: 0,
    totalRevenue: 0,
    activeLoads: 0,
    completedLoads: 0
  });

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
        
        // Fetch loads
        const loadRes = await fetch(`/api/loads?limit=100`);
        const loadData = await loadRes.json();
        const loadsData = loadData.data || [];
        setLoads(loadsData);

        // Fetch vehicles for drivers
        if (role === "driver") {
          const vehicleRes = await fetch(`/api/vehicles`);
          const vehicleData = await vehicleRes.json();
          const vehiclesData = vehicleData.data || [];
          setVehicles(vehiclesData);
          if (vehiclesData[0]?.id) setActiveTab(vehiclesData[0].id);
        }

        // Fetch all users and statistics for admin
        if (role === "admin") {
          const [usersRes, statsRes] = await Promise.all([
            fetch(`/api/users?limit=100`),
            fetch(`/api/admin/statistics`)
          ]);

          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setAllUsers(usersData.data || []);
          }

          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStatistics(statsData);
          }
        }

        // User stats 
        const userRes = await fetch(`/api/users/me`);
        const userData = await userRes.json();

        if (role === "admin") {
          setStats({
            totalLoads: loadsData.length || 0,
            activeLoads: loadsData.filter((l: Load) => l.status === "Aktivan").length || 0,
            sentLoads: loadsData.filter((l: Load) => l.status === "Poslan" || l.status === "Sent" || l.status === "poslan").length || 0,
            deliveredLoads: loadsData.filter((l: Load) => l.status === "Dostavljen" || l.status === "dostavljen" || l.status === "Delivered" || l.status === "delivered").length || 0,
            canceledLoads: loadsData.filter((l: Load) => l.status === "Otkazan" || l.status === "otkazan" || l.status === "canceled").length || 0,
            userCount: allUsers.length || 0,
            totalVehicles: 0,
            rating: 0,
          });
        } else {
          setStats((s) => ({
            ...s,
            totalLoads: loadsData.length || 0,
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
        console.warn('Invalid coordinates for load:', load._id);
      }
      return isValid;
    })
    .map(load => ({
      id: load._id.toString(),
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
        return loads.filter(load => load.status === "Poslan" || load.status === "Aktivan");
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Sidebar
          role={role}
          navbarHeight={84}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <main 
          className={`flex-1 transition-all duration-300 min-h-screen ${
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
          }`}
        >
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="content-bg rounded-xl p-6 shadow-sm h-32"></div>
                  ))}
                </div>
                <div className="content-bg rounded-xl p-6 shadow-sm h-80 mb-6"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        role={role}
        navbarHeight={84}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main 
        className={`flex-1 transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <div className="p-4 md:p-6">
          <div className="mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-blue-500 mb-2">
                  Dobrodošli, {session?.user?.name || 'Korisniče'}!
                </h1>
                <p className="text-white">Pregledajte stanje vaših dostava i aktivnosti</p>
              </div>
            </div>

            {role === "admin" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                  <StatCard 
                    title="Ukupni prihod" 
                    value={`${statistics.totalRevenue.toFixed(2)} BAM`} 
                    icon={<DollarSign className="w-6 h-6" />} 
                    gradient="from-green-500 to-green-600"
                  />
                  <StatCard 
                    title="Mjesečni prihod" 
                    value={`${statistics.monthlyRevenue.toFixed(2)} BAM`} 
                    icon={<TrendingUp className="w-6 h-6" />} 
                    gradient="from-emerald-500 to-emerald-600"
                    growth={statistics.revenueGrowth}
                  />
                  <StatCard 
                    title="Novi korisnici" 
                    value={statistics.newUsersThisMonth} 
                    icon={<User className="w-6 h-6" />} 
                    gradient="from-blue-500 to-blue-600"
                    growth={statistics.userGrowth}
                  />
                  <StatCard 
                    title="Dostave ovaj mjesec" 
                    value={statistics.loadsThisMonth} 
                    icon={<Package className="w-6 h-6" />} 
                    gradient="from-purple-500 to-purple-600"
                    growth={statistics.loadGrowth}
                  />
                </div>

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
                    title="Ukupno korisnika" 
                    value={allUsers.length} 
                    icon={<Users className="w-6 h-6" />} 
                    gradient="from-indigo-500 to-indigo-600"
                  />
                </div>
              </>
            )}

            {mapLoads.length > 0 && (
              <div className="mb-6 md:mb-8">
                <div className="content-bg rounded-2xl shadow-lg overflow-hidden">
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
      </main>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  gradient,
  isRating = false,
  growth
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  gradient: string;
  isRating?: boolean;
  growth?: number;
}) {
  return (
    <div className="content-bg rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h6 className="text-white text-sm font-medium mb-1">{title}</h6>
          <h3 className="font-bold text-2xl md:text-3xl text-blue-500 group-hover:text-white transition-colors">
            {isRating && typeof value === 'number' ? value.toFixed(1) : value}
            {isRating && <span className="text-lg text-blue-500">/5</span>}
          </h3>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} text-white shadow-sm group-hover:scale-105 transition-transform duration-200`}>
          {icon}
        </div>
      </div>
      {growth !== undefined && (
        <div className={`flex items-center text-sm ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          <TrendingUp className={`w-4 h-4 mr-1 ${growth < 0 ? 'rotate-180' : ''}`} />
          {growth >= 0 ? '+' : ''}{growth}% od prošlog mjeseca
        </div>
      )}
    </div>
  );
}