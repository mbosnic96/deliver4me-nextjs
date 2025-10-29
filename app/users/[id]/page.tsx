"use client";

import React, { useEffect, useState, use } from "react";
import Image from "next/image";
import { FullUserDto } from "@/lib/types/user";
import { Vehicle } from "@/lib/types/vehicle";
import { 
  MapPin, Phone, Mail, Truck, User, Navigation2, Share2,
  ArrowLeft, Shield, MessageCircle,
  AtSign, Flag
} from "lucide-react";
import Link from "next/link";
import RatingsCard from "@/components/RatingsCard";
import ReviewsList from "@/components/ReviewsList";
import { LeafletMap } from "@/components/LeafletMap";
import { LatLngTuple } from "leaflet";
import { toast } from "react-toastify";
import { ReportDialog } from "@/components/ReportDialog";
import { useSession } from "next-auth/react";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = use(params);
  const [user, setUser] = useState<FullUserDto | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [userRes, vehiclesRes, reviewsRes] = await Promise.all([
          fetch(`/api/users/${id}`),
          fetch(`/api/users/${id}/vehicles`),
          fetch(`/api/users/${id}/reviews`)
        ]);

        if (userRes.ok) {
          const userData: FullUserDto = await userRes.json();
          setUser(userData);

          if (userData.latitude && userData.longitude) {
            setUserLocation([userData.latitude, userData.longitude]);
          }
        }

        if (vehiclesRes.ok) {
          const vehiclesData: Vehicle[] = await vehiclesRes.json();
          setVehicles(vehiclesData);
        }

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getVehicleId = (vehicle: Vehicle): string => vehicle.id || vehicle._id || `temp-${vehicles.indexOf(vehicle)}`;

  const getVehicleImageUrl = (vehicle: Vehicle, imagePath: string) => {
    if (!imagePath) return '/assets/default-vehicle.jpg';
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
    return `/uploads/vehicles/${getVehicleId(vehicle)}/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-blue-500 mb-2">User Not Found</div>
          <p className="text-gray-600 mb-4">The requested user could not be found.</p>
          <Link href="/users" className="btn btn-primary">
            <ArrowLeft size={16} className="mr-2" />
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const totalReviews = reviews.length;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
       <div className={`grid grid-cols-1 gap-8 ${
  user.role === 'driver' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
}`}>
          <div className="lg:col-span-2 space-y-6">
            <div className="content-bg rounded-xl shadow-sm border p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex justify-center lg:justify-start">
                  <div className="w-32 h-32 relative rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {user.photoUrl ? (
                      <Image src={user.photoUrl} alt="Profile Photo" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <User size={48} className="text-blue-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                      <p className="flex items-center text-blue-600">
                        <AtSign size={14} className="mr-1 text-blue-600" />
                        {user.userName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.role === 'admin' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          <Shield size={12} className="inline mr-1 text-blue-600" />Admin
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'driver' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'driver' ? 'Vozač' : 'Klijent'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-white">
                      <MapPin size={16} className="mr-2 text-blue-600" />
                      <span>{user.city || 'Nepoznato'}, {user.country || 'Nepoznato'}</span>
                    </div>
                    <div className="flex items-center text-white">
                      <Phone size={16} className="mr-2 text-blue-500" />
                      <a href={`tel:${user.phone}`} className="hover:text-primary-600">
                        {user.phone || 'Nepoznato'}
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap space-x-3 pt-4">
                    <a href={`tel:${user.phone}`} className="btn btn-primary flex items-center mb-1">
                      <Phone size={16} className="mr-2 text-blue-600" />Pozovi
                    </a>

                    <button
                      onClick={async () => {
                        const url = window.location.href;
                        try {
                          if (navigator.share) {
                            await navigator.share({ title: user.name, url });
                            toast.success("Link podijeljen!");
                          } else {
                            await navigator.clipboard.writeText(url);
                            toast.success("Link kopiran u clipboard!");
                          }
                        } catch {
                          toast.error("Greška pri dijeljenju linka");
                        }
                      }}
                      className="btn btn-primary flex items-center mb-1"
                    >
                      <Share2 size={16} className="mr-2 text-blue-600" />Podijeli
                    </button>

                    {session?.user?.id && user && session.user.id !== user.id && (
                      <Link href={`/messages?with=${user.id}`} className="btn btn-primary flex items-center mb-1">
                        <MessageCircle size={16} className="mr-2 text-blue-600" />Pošalji poruku
                      </Link>
                    )}

                    {session?.user?.id && user && session.user.id !== user.id && (
                      <ReportDialog
                        reportedUserId={user.id}
                        reportedUserName={user.name}
                        trigger={
                          <button className="btn flex items-center mb-1 text-red-600">
                            <Flag size={16} className="mr-2" />Prijavi
                          </button>
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="content-bg rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <Navigation2 size={20} className="mr-2 text-blue-600" />Lokacija korisnika
              </h3>
              <p className="text-white mb-4 text-sm">Prikazana je zadnja poznata lokacija korisnika.</p>
              <div className="h-72 rounded-lg border overflow-hidden">
                {userLocation ? (
                  <LeafletMap lat={userLocation[0]} lng={userLocation[1]} zoom={13} className="h-full w-full" />
                ) : (
                  <div className="h-full flex items-center justify-center text-white content-bg">
                    <div className="text-center">
                      <MapPin size={32} className="mx-auto text-blue-600 mb-2" />
                      <p>Lokacija korisnika nije dostupna</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <RatingsCard averageRating={averageRating} totalReviews={totalReviews} />
            <ReviewsList userId={user.id} />
          </div>

          {user.role === 'driver' && (
            <div className="space-y-6">
              <div className="content-bg rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center">
                  <Truck size={20} className="mr-2 text-blue-600" />Vozila ({vehicles.length})
                </h3>
                {vehicles.length === 0 && (
                  <p className="text-white text-center py-8">Korisnik nema registrovanih vozila</p>
                )}
              </div>

              {vehicles.map((vehicle) => (
                <div key={getVehicleId(vehicle)} className="content-bg rounded-xl shadow-sm border overflow-hidden">
                  {vehicle.images.length > 0 && (
                    <Swiper modules={[Navigation]} navigation className="aspect-video">
                      {vehicle.images.map((img, idx) => (
                        <SwiperSlide key={idx}>
                          <Image
                            src={getVehicleImageUrl(vehicle, img)}
                            alt={vehicle.model || "Vehicle"}
                            fill
                            className="object-cover"
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  )}

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-blue-500">{vehicle.model || "Nepoznat model"}</h4>
                        <p className="text-white text-sm">{vehicle.brand || "Nepoznata marka"}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {vehicle.volume?.toFixed(2) ?? 0} m³
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-blue-500 uppercase font-medium mb-1">Registracija</div>
                        <div className="font-semibold text-white">{vehicle.plateNumber || "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-blue-500 uppercase font-medium mb-1">Dimenzije</div>
                        <div className="font-semibold text-white">{vehicle.width ?? 0}×{vehicle.length ?? 0}×{vehicle.height ?? 0}m</div>
                      </div>
                    </div>

                    {vehicle.cargoPercentage !== undefined && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-blue-500 uppercase font-medium mb-1">Zauzeće tereta</div>
                        <div className="font-semibold text-white">{vehicle.cargoPercentage}%</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
