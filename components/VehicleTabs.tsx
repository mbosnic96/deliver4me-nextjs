"use client";

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

interface VehicleTabsProps {
  vehicles: Vehicle[];
  activeTab: string | null;
  setActiveTab: (id: string) => void;
}

export function VehicleTabs({ vehicles, activeTab, setActiveTab }: VehicleTabsProps) {
  return (
    <div className="content-bg rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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