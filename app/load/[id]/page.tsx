"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { 
  MapPin, Truck, Package, User, Calendar, AtSign, 
  Phone, Flag, Eye, Mail, Euro, Clock, Weight, Ruler,
  ArrowLeft, Share2, Heart, Star, MessageSquare, Loader2
} from "lucide-react";
import Link from "next/link";

interface LoadPageProps {
  params: Promise<{ id: string }>;
}

type LoadType = {
  _id: string;
  userId?: string;
  title: string;
  description: string;
  pickupCountry: string;
  pickupState: string;
  pickupCity: string;
  pickupAddress: string;
  preferredPickupDate: string | Date;
  pickupTime: string;
  deliveryCountry: string;
  deliveryState: string;
  deliveryCity: string;
  deliveryAddress: string;
  preferredDeliveryDate: string | Date;
  maxDeliveryTime: string;
  cargoWeight: number;
  cargoVolume: number;
  cargoWidth: number;
  cargoHeight: number;
  cargoLength: number;
  fixedPrice: number;
  status: string;
  images: string[];
  assignedBidId?: string;
  contactPerson?: string;
  contactPhone?: string;
};

type UserType = {
  _id: string;
  name: string;
  userName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  photoUrl?: string;
  email?: string;
  rating?: number;
  reviewsCount?: number;
};

export default function LoadPage({ params }: LoadPageProps) {
  const [loadData, setLoadData] = useState<LoadType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = use(params);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        const loadResponse = await fetch(`/api/loads/${id}`);
        if (!loadResponse.ok) {
          throw new Error('Failed to fetch load data');
        }

        const loadData = await loadResponse.json();
        setLoadData(loadData);

        if (loadData.userId) {
          try {
            const userResponse = await fetch(`/api/users/${loadData.userId}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser({ ...userData, _id: userData.id ?? userData._id });
            }
          } catch (userError) {
            console.error("Error fetching user data:", userError);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error("Error fetching load data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);


  const nextImage = () => {
    if (loadData?.images && loadData.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % loadData.images.length);
    }
  };

  const prevImage = () => {
    if (loadData?.images && loadData.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + loadData.images.length) % loadData.images.length);
    }
  };

  const statusColors = {
    Aktivan: "bg-green-100 text-green-800",
    Poslan: "bg-blue-100 text-blue-800",
    Otkazan: "bg-red-100 text-red-800",
    Dostavljen: "bg-purple-100 text-purple-800"
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-primary-600" />
      </div>
    );
  }

  if (error || !loadData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-2xl font-semibold text-white  mb-4">Error</div>
          <p className="text-white mb-6">{error || "Load not found"}</p>
          <Link 
            href="/loads" 
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2 text-blue-600" />
            Back to Loads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="content-bg shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/loads" 
              className="flex items-center text-white hover:text-blue-600  transition-colors"
            >
              <ArrowLeft size={20} className="mr-2 text-blue-600" />
              Back to Loads
            </Link>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-blue-600 hover:text-blue-600 transition-colors">
                <Heart size={20} />
              </button>
              <button className="p-2 text-blue-600 hover:text-blue-600 transition-colors">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {loadData.images && loadData.images.length > 0 && (
              <div className="content-bg rounded-xl shadow-sm border overflow-hidden">
                <div className="relative aspect-video">
                  <Image
                    src={(loadData.images[currentImageIndex])}
                    alt={loadData.title}
                    fill
                    className="object-contain"
                    priority
                  />
                  
                  {loadData.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 content-bg/80 hover:content-bg p-2 rounded-full shadow-md transition-colors"
                      >
                        <ArrowLeft size={20} className="text-blue-600" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 content-bg/80 hover:content-bg p-2 rounded-full shadow-md transition-colors"
                      >
                        <ArrowLeft size={20} className="rotate-180 text-blue-600" />
                      </button>
                    </>
                  )}
                  đ
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {loadData.images.length}
                  </div>
                </div>

                {loadData.images.length > 1 && (
                  <div className="p-4 flex space-x-2 overflow-x-auto">
                    {loadData.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex
                            ? "border-primary-500 ring-2 ring-primary-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={(img)}
                          alt={`Thumbnail ${index + 1}`}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="content-bg rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between mb-6">
                <h1 className="text-2xl font-bold text-white ">{loadData.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[loadData.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
                }`}>
                  {loadData.status}
                </span>
              </div>

              <p className="text-white text-lg mb-6 leading-relaxed">{loadData.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <MapPin className="text-blue-600 mr-2" size={20} />
                    <h3 className="font-semibold text-white ">Preuzimanje</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    {loadData.pickupAddress}, {loadData.pickupCity}
                    <br />
                    {loadData.pickupState}, {loadData.pickupCountry}
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={14} className="mr-1" />
                    {format(new Date(loadData.preferredPickupDate), "dd.MM.yyyy")} u {loadData.pickupTime}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Truck className="text-green-600 mr-2" size={20} />
                    <h3 className="font-semibold text-white ">Isporuka</h3>
                  </div>
                  <p className="text-gray-700 mb-2">
                    {loadData.deliveryAddress}, {loadData.deliveryCity}
                    <br />
                    {loadData.deliveryState}, {loadData.deliveryCountry}
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={14} className="mr-1" />
                    Do {loadData.maxDeliveryTime}
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4">
                <h3 className="font-semibold text-white  mb-4 flex items-center">
                  <Package className="text-blue-600 mr-2" size={20} />
                  Detalji tereta
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Weight className="text-blue-600 mx-auto mb-2" size={24} />
                    <div className="font-semibold">{loadData.cargoWeight} kg</div>
                    <div className="text-smtext-white">Težina</div>
                  </div>
                  <div className="text-center">
                    <Ruler className="text-blue-600 mx-auto mb-2" size={24} />
                    <div className="font-semibold">{loadData.cargoVolume} m³</div>
                    <div className="text-smtext-white">Zapremina</div>
                  </div>
                  <div className="text-center">
                     <Ruler className="text-blue-600 mx-auto mb-2" size={24} />
                    <div className="font-semibold mb-2 text-sm">
                      {loadData.cargoWidth}m × {loadData.cargoHeight}m × {loadData.cargoLength}m
                    </div>
                    <div className="text-smtext-white">Dimenzije</div>
                  </div>
                  <div className="text-center">
                    <Euro className="text-blue-600 mx-auto mb-2" size={24} />
                    <div className="font-semibold">{loadData.fixedPrice.toFixed(2)} BAM</div>
                    <div className="text-smtext-white">Cijena</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="content-bg rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-white  mb-4">Cijena usluge</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {loadData.fixedPrice.toFixed(2)} BAM
                </div>
                <p className="text-white text-sm">Cijena koju korisnik plaća</p>
              </div>
            </div>

            {user && (
              <div className="content-bg rounded-xl shadow-sm border p-6">
                <div className="text-center mb-4">
                  {user.photoUrl ? (
                    <Image
                      src={user.photoUrl}
                      alt={user.name}
                      width={80}
                      height={80}
                      className="rounded-full mx-auto mb-3 object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <User size={32} className="text-gray-400" />
                    </div>
                  )}
                  <h3 className="font-semibold text-white ">{user.name}</h3>
                  <p className="text-white text-sm flex items-center justify-center">
                    <AtSign size={12} className="mr-1 text-blue-600"/>
                    {user.userName}
                  </p>
                  
                  {user.rating !== undefined && (
                    <div className="flex items-center justify-center mt-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < Math.floor(user.rating!) ? "text-yellow-400 fill-current" : "text-gray-300"}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-white ml-2">
                        ({user.reviewsCount || 0})
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-centertext-white">
                    <MapPin size={14} className="mr-2 flex-shrink-0 text-blue-600" />
                    <span className="truncate">{user.address}, {user.city}</span>
                  </div>
                  <div className="flex items-center text-white">
                    <Flag size={14} className="mr-2 flex-shrink-0 text-blue-600" />
                    {user.country}
                  </div>
                  <div className="flex items-center text-white">
                    <Phone size={14} className="mr-2 flex-shrink-0 text-blue-600" />
                    <a href={`tel:${user.phone}`} className="hover:text-primary-600 transition-colors">
                      {user.phone}
                    </a>
                  </div>
                </div>

                <div className="flex space-x-3 mt-4">
                  <Link
                    href={`/users/${user._id}`}
                    className="flex-1 btn btn-outline flex items-center justify-center py-2"
                  >
                    <Eye size={16} className="mr-2 text-blue-600" />
                    Profil
                  </Link>
                  <a
                    href={`mailto:${user.email}`}
                    className="flex-1 btn btn-primary flex items-center justify-center py-2"
                  >
                    <Mail size={16} className="mr-2 text-blue-600" />
                    Kontakt
                  </a>
                </div>
              </div>
            )}

            <div className="content-bg rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-white  mb-4">Interesuje vas teret?</h3>
              <button className="w-full btn btn-primary mb-3 py-2">
                <MessageSquare size={16} className="mr-2 text-blue-600" />
                Pošalji poruku
              </button>
              <button className="w-full btn btn-outline py-2">
                <Heart size={16} className="mr-2 text-blue-600" />
                Sačuvaj
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}