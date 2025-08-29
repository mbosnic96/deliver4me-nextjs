"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { VehicleForm } from "@/components/VehicleForm";
import Sidebar from "@/components/Sidebar";
import Swal from "sweetalert2";
import { useSession } from "next-auth/react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  plateNumber: string;
  width: number;
  length: number;
  height: number;
  volume: number;
  vehicleType?: { name: string };
  images: string[];
  createdAt: string;
  active: boolean;
}

export default function VehiclesPage() {
  const { data: session, status } = useSession();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const role = session?.user?.role as "client" | "driver" | "admin" | undefined;

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await axios.get<Vehicle[]>("/api/vehicles");
      setVehicles(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchVehicles();
    }
  }, [status]);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    await axios.delete(`/api/vehicles/${id}`);
    fetchVehicles();
    Swal.fire("Deleted!", "Vehicle has been deleted.", "success");
  };

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    adaptiveHeight: true,
  };

  if (status === "loading") {
    return <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated" || !session) {
    return <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">Please sign in</div>;
  }

  const Spinner = ({ size = "lg" }) => (
  <div className={`animate-spin rounded-full border-4 border-t-transparent border-gray-400 ${size === "lg" ? "h-8 w-8" : "h-4 w-4"}`}></div>
);

  return (
    <div className="flex min-h-screen container mx-auto">
      <Sidebar
        role={role}
        navbarHeight={84}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-4 md:p-6">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors mb-5"
            onClick={() => { setEditingVehicle(undefined); setDialogOpen(true); }}
          >
            <i className="fas fa-plus text-lg"></i>
            <span>Dodaj Vozilo</span>
          </button>

          {loading ? (
  <div className="flex justify-center items-center h-64">
    <Spinner size="lg" />
  </div>
) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <div key={vehicle._id} className="group">
                  <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border-0 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:shadow-lg">
                    <div className="relative h-56 overflow-hidden rounded-t-lg">
                      {vehicle.images.length > 0 ? (
                        <Slider {...carouselSettings}>
                          {vehicle.images.map((img, i) => (
                            <div key={i} className="h-56">
                              <img
                                src={img || "/assets/default-vehicle.jpg"}
                                className="w-full h-56 object-cover"
                                alt={`Vehicle ${i + 1}`}
                              />
                            </div>
                          ))}
                        </Slider>
                      ) : (
                        <img
                          src="/assets/default-vehicle.jpg"
                          className="w-full h-56 object-cover"
                          alt="Default vehicle"
                        />
                      )}
                      <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg">
                        {vehicle.vehicleType?.name}
                      </div>
                    </div>

                    <div className="flex-1 p-4 pb-2">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold mb-0 text-gray-900 dark:text-white">
                            {vehicle.model}
                          </h3>
                          <small className="text-gray-600 dark:text-gray-400">{vehicle.brand}</small>
                        </div>
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">
                          {vehicle.volume.toFixed(2)} m³
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Registracija</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{vehicle.plateNumber}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Dimenzije</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {vehicle.width}x{vehicle.length}x{vehicle.height}m
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm border-t pt-3">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <i className="fas fa-calendar-alt mr-2"></i>
                          {new Date(vehicle.createdAt).toLocaleDateString()}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          vehicle.active 
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" 
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}>
                          <i className={`fas ${vehicle.active ? "fa-check-circle" : "fa-times-circle"} mr-1`}></i>
                          {vehicle.active ? "Aktivno" : "Neaktivno"}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex gap-2">
                      <button
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors text-sm"
                        onClick={() => { setEditingVehicle(vehicle); setDialogOpen(true); }}
                      >
                        <i className="fas fa-edit"></i>
                        <span>Uredi</span>
                      </button>
                      <button
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-colors text-sm"
                        onClick={() => handleDelete(vehicle._id)}
                      >
                        <i className="fas fa-trash"></i>
                        <span>Obriši</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <VehicleForm
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onSaved={() => { setDialogOpen(false); fetchVehicles(); }}
            initialData={editingVehicle}
          />
        </div>
      </main>
    </div>
  );
}