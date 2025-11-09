"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  Truck, 
  MapPin, 
  Calendar, 
  Euro, 
  Weight, 
  Ruler,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/Pagination";
import { Country, State, City } from "country-state-city";
import Select from "react-select";

interface Load {
  _id: string;
  title: string;
  description: string;
  pickupCountry: string;
  pickupState: string;
  pickupCity: string;
  pickupAddress: string;
  deliveryCountry: string;
  deliveryState: string;
  deliveryCity: string;
  deliveryAddress: string;
  preferredPickupDate: string;
  preferredDeliveryDate: string;
  cargoWeight: number;
  cargoVolume: number;
  cargoWidth: number;
  cargoHeight: number;
  cargoLength: number;
  fixedPrice: number;
  images: string[];
  status: string;
}

interface Filters {
  minPrice: string;
  maxPrice: string;
  minWeight: string;
  maxWeight: string;
  minLenght: string;
  maxLenght: string;
  minHeight: string;
  maxHeight: string;
  pickupCountry: string;
  pickupState: string;
  pickupCity: string;
  deliveryCountry: string;
  deliveryState: string;
  deliveryCity: string;
  minWidth: string;
  maxWidth: string;
  minPickupDate: string;
  maxDeliveryDate: string;
}

export default function LoadsPage() {
  const router = useRouter();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState<Filters>({
    minPrice: "",
    maxPrice: "",
    minWeight: "",
    maxWeight: "",
    minLenght: "",
    maxLenght: "",
    minHeight: "",
    maxHeight: "",
    pickupCountry: "",
    pickupState: "",
    pickupCity: "",
    deliveryCountry: "",
    deliveryState: "",
    deliveryCity: "",
    minWidth: "",
    maxWidth: "",
    minPickupDate: "",
    maxDeliveryDate: "",
  });

  const fetchLoads = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const res = await fetch(`/api/loads/filter?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLoads(data.data);
        setTotalPages(data.totalPages);
        setTotalCount(data.total);
        setCurrentPage(data.page);
      }
    } catch (error) {
      console.error("Failed to fetch loads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads(1);
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchLoads(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLoads(1);
  };

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      minWeight: "",
      maxWeight: "",
      minLenght: "",
      maxLenght: "",
      minHeight: "",
      maxHeight: "",
      pickupCountry: "",
      pickupState: "",
      pickupCity: "",
      deliveryCountry: "",
      deliveryState: "",
      deliveryCity: "",
      minWidth: "",
      maxWidth: "",
      minPickupDate: "",
      maxDeliveryDate: "",
    });
    setSearchTerm("");
  };

  const hasActiveFilters =
    Object.values(filters).some((value) => value !== "") || searchTerm !== "";

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            Dostupni Tereti
          </h1>
          <p className="text-white">Pronađite idealan teret za vaš transport</p>
        </div>

       
        <div className="content-bg rounded-lg shadow-sm border p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  type="text"
                  placeholder="Pretraži terete po nazivu ili opisu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2"
                />
              </div>
              <Button type="submit" className="bg-blue-700 hover:bg-blue-700">
                <Search size={20} className="mr-2" />
                Pretraži
              </Button>
              <Button
                type="button"
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={20} className="mr-2" />
                Filteri
              </Button>
              {hasActiveFilters && (
                <Button type="button" variant="outline" onClick={clearFilters}>
                  <X size={20} className="mr-2" />
                  Očisti
                </Button>
              )}
            </div>

           
            {showFilters && (
              <div className="space-y-6 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-white">
                      Budžet (BAM)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handleFilterChange("minPrice", e.target.value)
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange("maxPrice", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">
                      Težina (kg)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minWeight}
                        onChange={(e) =>
                          handleFilterChange("minWeight", e.target.value)
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxWeight}
                        onChange={(e) =>
                          handleFilterChange("maxWeight", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      Lokacija preuzimanja
                    </label>
                    <Select
                      options={Country.getAllCountries().map((c) => ({
                        value: c.isoCode,
                        label: c.name,
                      }))}
                      value={
                        filters.pickupCountry
                          ? {
                              value: filters.pickupCountry,
                              label: Country.getCountryByCode(filters.pickupCountry)?.name,
                            }
                          : null
                      }
                      onChange={(s) =>
                        handleFilterChange("pickupCountry", s?.value || "")
                      }
                      placeholder="Odaberite državu"
                      isClearable
                      className="text-gray-900"
                    />
                    <Select
                      options={
                        filters.pickupCountry
                          ? State.getStatesOfCountry(filters.pickupCountry).map(
                              (s) => ({ value: s.isoCode, label: s.name })
                            )
                          : []
                      }
                      value={
                        filters.pickupState
                          ? {
                              value: filters.pickupState,
                              label: State.getStateByCodeAndCountry(
                                filters.pickupState,
                                filters.pickupCountry || ""
                              )?.name,
                            }
                          : null
                      }
                      onChange={(s) =>
                        handleFilterChange("pickupState", s?.value || "")
                      }
                      placeholder="Odaberite regiju"
                      isClearable
                      
                      className="text-gray-900"
                    />
                    <Select
                      options={
                        filters.pickupCountry && filters.pickupState
                          ? (City.getCitiesOfCountry(
                              filters.pickupCountry
                            ) || []).map((c) => ({
                              value: c.name,
                              label: c.name,
                            }))
                          : []
                      }
                      value={
                        filters.pickupCity
                          ? { value: filters.pickupCity, label: filters.pickupCity }
                          : null
                      }
                      onChange={(s) =>
                        handleFilterChange("pickupCity", s?.value || "")
                      }
                      placeholder="Odaberite grad"
                      isClearable
                      
                      className="text-gray-900"
                    />
                  </div>

                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      Lokacija isporuke
                    </label>
                    <Select
                      options={Country.getAllCountries().map((c) => ({
                        value: c.isoCode,
                        label: c.name,
                      }))}
                      value={
                        filters.deliveryCountry
                          ? {
                              value: filters.deliveryCountry,
                              label: Country.getCountryByCode(filters.deliveryCountry)?.name,
                            }
                          : null
                      }
                      onChange={(s) =>
                        handleFilterChange("deliveryCountry", s?.value || "")
                      }
                      placeholder="Odaberite državu"
                      isClearable
                      
                      className="text-gray-900"
                    />
                    <Select
                      options={
                        filters.deliveryCountry
                          ? State.getStatesOfCountry(filters.deliveryCountry).map(
                              (s) => ({ value: s.isoCode, label: s.name })
                            )
                          : []
                      }
                      value={
                        filters.deliveryState
                          ? {
                              value: filters.deliveryState,
                              label: State.getStateByCodeAndCountry(
                                filters.deliveryState,
                                filters.deliveryCountry || ""
                              )?.name,
                            }
                          : null
                      }
                      onChange={(s) =>
                        handleFilterChange("deliveryState", s?.value || "")
                      }
                      placeholder="Odaberite regiju"
                      isClearable
                      
                      className="text-gray-900"
                    />
                    <Select
                      options={
                        filters.deliveryCountry && filters.pickupState
                          ? (City.getCitiesOfCountry(
                              filters.deliveryCountry
                            ) || []).map((c) => ({
                              value: c.name,
                              label: c.name,
                            }))
                          : []
                      }
                      value={
                        filters.deliveryCity
                          ? { value: filters.deliveryCity, label: filters.deliveryCity }
                          : null
                      }
                      onChange={(s) =>
                        handleFilterChange("deliveryCity", s?.value || "")
                      }
                      placeholder="Odaberite grad"
                      isClearable
                      
                      className="text-gray-900"
                    />
                  </div>
                </div>

               
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-white">
                      Širina (m)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minWidth}
                        onChange={(e) =>
                          handleFilterChange("minWidth", e.target.value)
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxWidth}
                        onChange={(e) =>
                          handleFilterChange("maxWidth", e.target.value)
                        }
                      />
                    </div>
                  </div>

                     <div>
                    <label className="text-sm font-medium text-white">
                      Dužina (m)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minLenght}
                        onChange={(e) =>
                          handleFilterChange("minLenght", e.target.value)
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxLenght}
                        onChange={(e) =>
                          handleFilterChange("maxLenght", e.target.value)
                        }
                      />
                    </div>
                  </div>

                     <div>
                    <label className="text-sm font-medium text-white">
                      Visina (m)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minHeight}
                        onChange={(e) =>
                          handleFilterChange("minHeight", e.target.value)
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxHeight}
                        onChange={(e) =>
                          handleFilterChange("maxHeight", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-white">
                      Datum preuzimanja
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={filters.minPickupDate}
                        onChange={(e) =>
                          handleFilterChange("minPickupDate", e.target.value)
                        }
                      />
                      
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">
                      Datum dostave
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={filters.maxDeliveryDate}
                        onChange={(e) =>
                          handleFilterChange("maxDeliveryDate", e.target.value)
                        }
                      />
                      
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

       
        <div className="flex justify-between items-center mb-4">
          <p className="text-white">Pronađeno {totalCount} tereta</p>
          <p className="text-white">
            Strana {currentPage} od {totalPages}
          </p>
        </div>

       
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
          </div>
        ) : loads.length === 0 ? (
          <div className="text-center py-20">
            <Truck className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-blue-600 mb-2">
              Nema pronađenih tereta
            </h3>
            <p className="text-white">Pokušajte promijeniti filtere ili pretragu</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {loads.map((load) => (
                <div
                  key={load._id}
                  className="content-bg rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/load/${load._id}`)}
                >
                  <div className="aspect-video relative rounded-t-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {load.images && load.images.length > 0 ? (
                      <img
                        src={load.images[0]}
                        alt={load.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src="/logo-light.png"
                        alt="Deliver4Me"
                        className="h-16 w-16 object-contain opacity-60"
                      />
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-blue-600 mb-2 line-clamp-2">
                      {load.title}
                    </h3>
                    <p className="text-white text-sm mb-3 line-clamp-2">
                      {load.description}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-white">
                        <MapPin size={14} className="mr-2 text-blue-600" />
                        <span>
                          {load.pickupCity} → {load.deliveryCity}
                        </span>
                      </div>
                      <div className="flex items-center text-white">
                        <Calendar size={14} className="mr-2 text-blue-600" />
                        <span>
                          {format(new Date(load.preferredPickupDate), "dd.MM.yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center text-white">
                          <Euro size={14} className="mr-1 text-green-600" />
                          <span className="font-semibold">
                            {load.fixedPrice?.toFixed(2)} BAM
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Weight size={12} />
                          <span>{load.cargoWeight}kg</span>
                          <Ruler size={12} />
                          <span>{load.cargoVolume}m³</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

     
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}