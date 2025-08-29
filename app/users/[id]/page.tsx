"use client";

import React, { useEffect, useState, use } from "react";
import Image from "next/image";
import { FullUserDto } from "@/lib/types/user";
import { Vehicle } from "@/lib/types/vehicle";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import RatingsCard from "@/components/RatingsCard";
import ReviewsList from "@/components/ReviewsList";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = use(params);
  const [user, setUser] = useState<FullUserDto | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const resUser = await fetch(`/api/users/${id}`);
        const userData: FullUserDto = await resUser.json();
        setUser(userData);

        const resVehicles = await fetch(`/api/users/${id}/vehicles`);
        const vehiclesData: Vehicle[] = resVehicles.ok ? await resVehicles.json() : [];
        setVehicles(vehiclesData);

        const resReviews = await fetch(`/api/users/${id}/reviews`);
        const reviewsData = resReviews.ok ? await resReviews.json() : [];
        setReviews(reviewsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!user) return <div className="p-6 text-center text-red-500">User not found</div>;

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const totalReviews = reviews.length;

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    adaptiveHeight: true,
  };

  return (
    <div className="container mx-auto mt-12 space-y-12">
      <div className="p-4 border rounded-2xl bg-gray-50 dark:bg-gray-800">
        <h2 className="text-2xl font-semibold mb-4">Profil korisnika</h2>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 flex justify-center">
            <div className="w-48 h-48 relative rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {user.photoUrl ? (
                <Image
                  src={user.photoUrl}
                  alt="Profile Photo"
                  fill
                  className="object-cover"
                />
              ) : (
                <Image
                  src="/user.png"
                  alt="Placeholder"
                  fill
                  className="object-cover"
                />
              )}
            </div>
          </div>

          <div className="lg:w-2/3 space-y-3">
            <div>
              <label className="text-gray-500">Ime i prezime</label>
              <div className="font-bold">{user.name}</div>
            </div>
            <div>
              <label className="text-gray-500">Korisničko ime</label>
              <div className="font-bold">{user.userName}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-500">Država</label>
                <div className="font-bold">{user.country || "-"}</div>
              </div>
              <div>
                <label className="text-gray-500">Regija/Kanton</label>
                <div className="font-bold">{user.state || "-"}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-500">Grad</label>
                <div className="font-bold">{user.city || "-"}</div>
              </div>
              <div>
                <label className="text-gray-500">Poštanski broj</label>
                <div className="font-bold">{user.postalCode || "-"}</div>
              </div>
            </div>
            <div>
              <label className="text-gray-500">Adresa</label>
              <div className="font-bold">{user.address || "-"}</div>
            </div>
            <div>
              <label className="text-gray-500">Telefon</label>
              <div className="font-bold">{user.phone || "-"}</div>
              {user.phone && (
                <a href={`tel:${user.phone}`} className="btn btn-primary mt-2 inline-block">
                  Kontaktiraj
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-2xl bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-2">Tačna lokacija</h3>
        <p className="text-gray-500 mb-3">Prikazana je zadnja poznata lokacija korisnika.</p>
        <div id="map" className="h-72 rounded-2xl border"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <div key={vehicle._id} className="group">
            <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border-0 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="relative h-56 overflow-hidden rounded-t-lg">
                {vehicle.images.length > 0 ? (
                  <Slider {...carouselSettings}>
                    {vehicle.images.map((img, i) => (
                      <div key={i} className="h-56">
                        <img
                          src={img || "/assets/default-vehicle.jpg"}
                          className="w-full h-56 object-contain"
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
                {vehicle.vehicleType && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg z-10">
                    {vehicle.vehicleType.name}
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 pb-2">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {vehicle.model || "Unknown Model"}
                    </h3>
                    <small className="text-gray-600 dark:text-gray-400">
                      {vehicle.brand || "Unknown Brand"}
                    </small>
                  </div>
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">
                    {vehicle.volume?.toFixed(2) ?? 0} m³
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                      Registracija
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {vehicle.plateNumber || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                      Dimenzije
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {vehicle.width ?? 0}x{vehicle.length ?? 0}x{vehicle.height ?? 0} m
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <RatingsCard averageRating={averageRating} totalReviews={totalReviews} />
      <ReviewsList userId={user.id} />
    </div>
  );
}
