"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { format } from "date-fns";
import {
  MapPin, Truck, Package, User, Calendar, AtSign,
  Phone, Flag, Eye, Mail, Euro, Weight, Ruler,
  ArrowLeft, Share2, Heart, Star, Loader2,
  Gavel, Award, X, MessageSquare, ArrowLeftRight 
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {toast} from "react-toastify";
import { ReviewDialog } from "@/components/ReviewDialog";
//import { RouteMap } from "@/components/RouteMap";
import { LatLngTuple } from "leaflet";
import { parseISO } from "date-fns";
import { getCountryName, getStateName } from '@/lib/services/CscService';
import { createNotification } from '@/lib/notifications';
import { ReportDialog } from "@/components/ReportDialog";
import dynamic from "next/dynamic";
const RouteMap = dynamic(() => import("@/components/RouteMap").then(mod => mod.RouteMap), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full rounded-lg bg-gray-100 flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      <span className="ml-2">Učitavam mapu...</span>
    </div>
  )
});
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
   pickupLatitude?: number;         
  pickupLongitude?: number;  
  preferredPickupDate: string;
  pickupTime: string;
  deliveryCountry: string;
  deliveryState: string;
  deliveryCity: string;
  deliveryAddress: string;
  deliveryLatitude?: number;     
  deliveryLongitude?: number;    
  preferredDeliveryDate: string;
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
  role?: string;
};

type VehicleType = {
  _id: string;
  brand: string;
  model: string;
  plateNumber: string;
};

type BidType = {
  _id: string;
  loadId: string;
  driverId: string;
  price: number;
  message: string;
  status: string;
  createdAt: string;
  driver?: UserType;
  vehicle?: VehicleType;
};

export default function LoadPage({ params }: LoadPageProps) {
  const resolvedParams = use(params); 
  const { id } = resolvedParams;
  const { data: session, status: sessionStatus } = useSession();

  const [loadData, setLoadData] = useState<LoadType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [bids, setBids] = useState<BidType[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const acceptedBid = bids.find(bid => bid.status === "accepted");
  const [vehicles, setVehicles] = useState<{ _id: string; brand: string; model: string; plateNumber: string; }[]>([]);
const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const isOwner = session?.user?.id === loadData?.userId;
  const isDriver = session?.user?.role === "driver";


//fetch load data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        const loadRes = await fetch(`/api/loads/${id}`);
        if (!loadRes.ok) throw new Error("Failed to fetch load data");
        const load = await loadRes.json();
        setLoadData(load);

        if (load.userId) {
          const userRes = await fetch(`/api/users/${load.userId}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser({ ...userData, _id: userData._id ?? userData.id });
          }
        }

        const bidsRes = await fetch(`/api/bids?loadId=${id}`);
        if (bidsRes.ok) {
          const bidsData = await bidsRes.json();
          setBids(bidsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  useEffect(() => {
  const checkReview = async () => {
    if (session?.user?.id && loadData?._id) {
      try {
        const res = await fetch(
          `/api/reviews/check?loadId=${loadData._id}&userId=${session.user.id}`
        )
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        
        const text = await res.text()
        if (!text) {
          console.warn('Empty response from review check API')
          return
        }
        
        const data = JSON.parse(text)
        setHasReviewed(data.hasReviewed)
      } catch (err) {
        console.error("Failed to check review:", err)
      }
    }
  }
  
  checkReview()
}, [session?.user?.id, loadData?._id])

  useEffect(() => {
    if (loadData?.status === "Dostavljen" && !hasReviewed) {
      setIsReviewOpen(true);
    }
  }, [loadData?.status, hasReviewed]);


useEffect(() => {
  const fetchVehicles = async () => {
    if (session?.user?.id && isDriver) {
      try {
        const res = await fetch(`/api/vehicles`)
        if (res.ok) {
          const responseData = await res.json()
          setVehicles(responseData.data || [])
        } else {
          console.error('Failed to fetch vehicles')
        }
      } catch (err) {
        console.error('Failed to fetch vehicles:', err)
      }
    }
  }
  
  fetchVehicles()
}, [session?.user?.id, isDriver])

  const handleBidAction = async (bidId: string, action: "accepted" | "rejected") => {
    try {
      const res = await fetch(`/api/bids/${bidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });

      if (!res.ok) throw new Error("Failed to update bid");
      const updatedBid = await res.json();
      setBids((prev) => prev.map((b) => (b._id === updatedBid._id ? updatedBid : b)));

      if (updatedBid.driverId) {
        const message = action === "accepted" 
          ? `Vaša ponuda za teret "${loadData?.title}" je prihvaćena!` 
          : `Vaša ponuda za teret "${loadData?.title}" je odbijena.`;
        
        const link = `/load/${id}`;
        
        await createNotification(updatedBid.driverId, message, link);
      }

      if (action === "accepted") {
        const loadRes = await fetch(`/api/loads/${id}`);
        if (loadRes.ok) setLoadData(await loadRes.json());
        toast.success("Ponuda uspješno prihvaćena!");
      } else {
        toast.success("Ponuda uspješno odbijena!");
      }
    } catch (err) {
      toast.error("Greška pri ažuriranju ponude!");
    }
  };

  const handleCancelAcceptedBid = async (bidId: string) => {
    try {
      const res = await fetch(`/api/bids/${bidId}/cancel`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to cancel bid");

      const { bid, load } = await res.json();
      setLoadData(load);

      const bidsRes = await fetch(`/api/bids?loadId=${id}`);
      if (bidsRes.ok) setBids(await bidsRes.json());

       if (bid.driverId) {
        const message = `Prihvaćena ponuda za teret "${loadData?.title}" je otkazana.`;
        const link = `/load/${id}`;
        
        await createNotification(bid.driverId, message, link);
      }

      toast.success("Prihvaćena ponuda otkazana!");
    } catch (err) {
      toast.error("Greška pri otkazivanju ponude!");
    }
  };

 const handleSubmitBid = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!session?.user?.id || !bidPrice) return;

  const numericBid = parseFloat(bidPrice);

  if (numericBid > (loadData?.fixedPrice ?? Infinity)) {
    toast.error(`Ponuda ne može biti veća od ${loadData?.fixedPrice.toFixed(2)} BAM`);
    return;
  }

  setIsSubmittingBid(true);
  try {
    const res = await fetch("/api/bids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loadId: id,
        price: numericBid,
        message: bidMessage,  
        vehicleId: selectedVehicleId
      }),
    });

    if (!res.ok) throw new Error("Failed to submit bid");
    const newBid = await res.json();
    setBids((prev) => [...prev, newBid]);
    setBidPrice("");
    setBidMessage("");
    setShowBidForm(false);

    if (loadData?.userId) {
      const message = `Nova ponuda za vaš teret "${loadData.title}" od ${session.user.name}`;
      const link = `/load/${id}`;
      await createNotification(loadData.userId, message, link);
    }
    
    toast.success("Ponuda poslana!");
  } catch (err) {
    toast.error("Greška pri slanju ponude!");
  } finally {
    setIsSubmittingBid(false);
  }
};


  const nextImage = () =>
    loadData?.images?.length &&
    setCurrentImageIndex((i) => (i + 1) % loadData.images.length);

  const prevImage = () =>
    loadData?.images?.length &&
    setCurrentImageIndex((i) => (i - 1 + loadData.images.length) % loadData.images.length);

  const statusColors = {
    Aktivan: "bg-green-100 text-green-800",
    Poslan: "bg-blue-100 text-blue-800",
    Otkazan: "bg-red-100 text-red-800",
    Dostavljen: "bg-purple-100 text-purple-800",
  };

    const bidStatusColors = {
    pending: "",
    accepted: "bg-green-400 border-green-200",
    rejected: "bg-red-400 border-red-200",
    canceled: "bg-gray-400 border-gray-200"
  };


  const bidStatusText = {
    pending: "Na čekanju",
    accepted: "Prihvaćeno",
    rejected: "Odbijeno",
    canceled: "Otkazano",
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
        <div className="text-center">
          <h2 className="text-2xl text-red-500 mb-2">Greška</h2>
          <p>{error || "Teret nije pronađen"}</p>
          <Link href="/load" className="text-blue-500 underline mt-4 block">
            ← Nazad
          </Link>
        </div>
      </div>
    );
  }




  return (
    <div className="min-h-screen">
      <div className="content-bg shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/load" 
              className="flex items-center text-white hover:text-blue-600  transition-colors"
            >
              <ArrowLeft size={20} className="mr-2 text-blue-600" />
               Nazad
            </Link>
            <div className="flex items-center space-x-2">
              {session?.user?.id && user && session.user.id !== user._id && (
                <ReportDialog
                  reportedUserId={user._id}
                  reportedUserName={user.name}
                  loadId={loadData?._id}
                  loadTitle={loadData?.title}
                  trigger={
                    <button className="p-2 text-red-600 hover:text-red-700 transition-colors">
                      <Flag size={20} />
                    </button>
                  }
                />
              )}

              
              <button
                  onClick={async () => {
                    const url = window.location.href;
                    try {
                      if (navigator.share) {
                        await navigator.share({
                          title: loadData?.title || "Teret",
                          url,
                        });
                        toast.success("Link podijeljen!");
                      } else {
                        await navigator.clipboard.writeText(url);
                        toast.success("Link kopiran u clipboard!");
                      }
                    } catch (err) {
                      console.error(err);
                      toast.error("Greška pri dijeljenju linka");
                    }
                  }}
                  className="p-2 text-blue-600 hover:text-blue-600 transition-colors"
                >
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative mt-4">
        <div className="bg-blue-50 rounded-lg p-4 relative">
          <div className="flex items-center mb-3">
            <MapPin className="text-blue-600 mr-2" size={20} />
            <h3 className="font-semibold text-blue-800">Preuzimanje</h3>
          </div>
          <p className="text-gray-700 mb-2">
            {loadData.pickupAddress}, {loadData.pickupCity}
            <br />
            {getStateName(loadData.pickupCountry, loadData.pickupState)}, {getCountryName(loadData.pickupCountry)}
          </p>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Calendar size={14} className="mr-1" />
            {format(parseISO(loadData.preferredPickupDate), "dd.MM.yyyy HH:mm")}
          </div>
          
        </div>

        <div className="bg-green-50 rounded-lg p-4 relative">
          <div className="flex items-center mb-3">
            <Truck className="text-green-600 mr-2" size={20} />
            <h3 className="font-semibold text-green-800">Isporuka</h3>
          </div>
          {loadData.contactPerson && (
            <div className="mt-2 text-gray-700 mb-2">
              <User size={16} className="inline mr-1 text-blue-600" /> {loadData.contactPerson}
              <br />
              <Phone size={16} className="inline mr-1 text-blue-600" />{' '}
              <a href={`tel:${loadData.contactPhone}`}>{loadData.contactPhone}</a>
            </div>
          )}
          <p className="text-gray-700 mb-2">
            {loadData.deliveryAddress}, {loadData.deliveryCity}
            <br />
            {getStateName(loadData.deliveryCountry, loadData.deliveryState)}, {getCountryName(loadData.deliveryCountry)}
          </p>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Calendar size={14} className="mr-1" />
            {format(parseISO(loadData.preferredDeliveryDate), "dd.MM.yyyy HH:mm")}
          </div>
        </div>

        <div className="hidden md:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <ArrowLeftRight size={40} className="text-blue-500" />
        </div>
      </div>

     {loadData.pickupLatitude && loadData.pickupLongitude && loadData.deliveryLatitude && loadData.deliveryLongitude && (
  <div className="h-96 w-full rounded-lg overflow-hidden mt-2">
    <RouteMap
      pickup={{
        lat: loadData.pickupLatitude,
        lng: loadData.pickupLongitude,
        address: `${loadData.pickupAddress}, ${loadData.pickupCity}`
      }}
      delivery={{
        lat: loadData.deliveryLatitude,
        lng: loadData.deliveryLongitude,
        address: `${loadData.deliveryAddress}, ${loadData.deliveryCity}`
      }}
      className="h-full w-full"
      zoom={8} 
    />
    <div className="mt-2 text-sm text-gray-600 text-center">
      Ruta od preuzimanja do isporuke
    </div>
  </div>
)}

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

         
           

            
            {isDriver && loadData.status === "Aktivan" && sessionStatus === "authenticated" && (
              <div className="content-bg rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-white  mb-4 flex items-center">
                  <Award className="text-blue-600 mr-2" size={20} />
                  {showBidForm ? "Pošalji ponudu" : "Interesuje vas teret?"}
                </h3>
                
                {showBidForm ? (
                  <form onSubmit={handleSubmitBid}>
                    <div className="mb-4">
                      <label className="block text-white  mb-2">
                        Vaša ponuda (BAM)
                      </label>
                      <input
                        type="number"
                        value={bidPrice}
                        onChange={(e) => setBidPrice(e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        placeholder="Unesite cijenu"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                   {showBidForm && (
  <div className="mb-4">
    <label className="block text-white mb-2">Odaberite vozilo</label>
    {vehicles.length > 0 ? (
      <select
        value={selectedVehicleId || ""}
        onChange={(e) => setSelectedVehicleId(e.target.value)}
        className="w-full p-3 border rounded-lg"
        required
      >
        <option value="" disabled>Odaberite vozilo</option>
        {vehicles.map(vehicle => (
          <option key={vehicle._id} value={vehicle._id}>
            {vehicle.brand} {vehicle.model} ({vehicle.plateNumber})
          </option>
        ))}
      </select>
    ) : (
      <div className="p-3 border rounded-lg text-center text-gray-500">
        {isDriver ? "Nema dostupnih vozila. Dodajte vozilo u svom profilu." : "Niste vozač"}
      </div>
    )}
  </div>
)}
                    
                    <div className="mb-4">
                      <label className="block text-white  mb-2">
                        Poruka (opcionalno)
                      </label>
                      <textarea
                        value={bidMessage}
                        onChange={(e) => setBidMessage(e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        placeholder="Dodatne informacije o vašoj ponudi"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowBidForm(false)}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-white"
                      >
                        Otkaži
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingBid}
                        className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg disabled:opacity-50"
                      >
                        {isSubmittingBid ? (
                          <Loader2 className="animate-spin mx-auto" size={20} />
                        ) : (
                          "Pošalji ponudu"
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-white mb-4">
                      Pošaljite svoju ponudu za prevoz ovog tereta. Vlasnik će vidjeti vašu ponudu i kontaktirati vas ako je prihvati.
                    </p>
                    <button
                      onClick={() => setShowBidForm(true)}
                      className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg"
                    >
                      Pošalji ponudu
                    </button>
                  </>
                )}
              </div>
            )}
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
                        ({user.reviewsCount || 0} recenzija) 
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
                    {getCountryName(user.country)}
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
                  {session?.user?.id && user && session.user.id !== user._id && (
                    <Link
                      href={`/messages?with=${user._id}&subject=${encodeURIComponent(`Pitanje o teretu: ${loadData.title}`)}`}
                      className="flex-1 btn btn-primary flex items-center justify-center py-2"
                    >
                      <MessageSquare size={16} className="mr-2" />
                      Pošalji poruku
                    </Link>
                  )}
                </div>
              </div>
            )}


             {isOwner && bids.length > 0 && (
              <div className="content-bg rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-white  mb-4 flex items-center">
                  <Gavel className="text-blue-600 mr-2" size={20} />
                  {loadData.status === "Aktivan" ? "Aktivne ponude" : "Sve ponude"} ({bids.length})
                </h3>
                
                <div className="space-y-4">
                  {bids.map((bid) => (
                    <div key={bid._id} className={`border rounded-lg p-4 ${bidStatusColors[bid.status as keyof typeof bidStatusColors] || ""}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {bid.driver?.photoUrl ? (
                            <Image
                              src={bid.driver.photoUrl}
                              alt={bid.driver.name}
                              width={40}
                              height={40}
                              className="rounded-full mr-3 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                              <User size={20} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-white">{bid.driver?.name}</h4>
                            <p className="text-sm text-white">@{bid.driver?.userName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary-600">{bid.price.toFixed(2)} BAM</div>
                          <div className="text-sm text-white">
                            {format(new Date(bid.createdAt), "dd.MM.yyyy HH:mm")}
                          </div>
                          {bid.status !== "pending" && (
                            <div className={`text-sm font-medium mt-1 ${
                              bid.status === "accepted" ? "text-green-600" :
                              bid.status === "rejected" ? "text-red-600" :
                              bid.status === "canceled" ? "text-gray-600" : ""
                            }`}>
                              {bidStatusText[bid.status as keyof typeof bidStatusText]}
                            </div>
                          )}
                        </div>
                      </div>

                       {bid.vehicle && (
                  <div className="mt-2 text-sm text-white">
                    Vozilo: {bid.vehicle.brand} {bid.vehicle.model} ({bid.vehicle.plateNumber})
                  </div>
                )}
                      
                      {bid.message && (
                        <div className="mt-2 p-3 content-bg rounded-lg">
                          <p className="text-white">{bid.message}</p>
                        </div>
                      )}

                        {bid.driver && (
                  <div className="mt-2 flex justify-end">
                    <Link
                      href={`/users/${bid.driver._id}`}
                      className="px-3 py-1 bg-blue-700 text-white rounded text-sm flex items-center"
                    >
                      <Eye size={14} className="mr-1" />
                      Vidi profil vozača
                    </Link>
                  </div>
                )}

                      
                      {loadData.status === "Aktivan" && bid.status === "pending" && (
                        <div className="mt-3 flex justify-end space-x-2">
                          <button
                            onClick={() => handleBidAction(bid._id, "rejected")}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                          >
                            Odbij
                          </button>
                          <button
                            onClick={() => handleBidAction(bid._id, "accepted")}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm"
                          >
                            Prihvati
                          </button>
                        </div>
                      )}
                      
                      {loadData.status === "Poslan" && bid.status === "accepted" && (
                        <div className="mt-3 flex justify-end space-x-2">
                          <button
                            onClick={() => handleCancelAcceptedBid(bid._id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm flex items-center"
                          >
                            <X size={14} className="mr-1" />
                            Otkaži prihvaćenu ponudu
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

{loadData?.userId && (
  <ReviewDialog
  isOpen={isReviewOpen}
  onClose={() => setIsReviewOpen(false)}
  session={session}
  loadData={{
    userId: loadData.userId, 
    driverId: acceptedBid?.driver?._id ?? null, 
    alreadyReviewed: hasReviewed,
  }}
  onSubmit={async (rating, comment, otherPartyId) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loadId: loadData._id,
          rating,
          comment,
          fromUserId: session?.user.id,
          toUserId: otherPartyId,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit review");
      toast.success("Recenzija poslana!");
    } catch (err) {
      console.error(err);
      toast.error("Greška pri slanju recenzije!");
    }
  }}
/>

)}



    </div>
  );
}