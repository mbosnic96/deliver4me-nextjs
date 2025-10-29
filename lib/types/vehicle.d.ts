export interface Vehicle {
  id: string;              
  _id?: string;             
  userId: string;
  brand: string;
  model: string;
  plateNumber: string;
  volume: number;
  width: number;
  length: number;
  height: number;
  vehicleType?: {
    name: string;
  };
  images: string[];         
  cargoPercentage: number;
  currentLoads: VehicleLoad[];
  createdAt: string;
}

export interface VehicleLoad {
  loadId: LoadData | { $oid: string }; 
  volumeUsed: number;
  status: "active" | "delivered" | "canceled";
  _id: {
    $oid: string;
  };
  title?: string;
  pickupCity?: string;
  deliveryCity?: string;
  fixedPrice?: number;
  createdAt?: string;
}

export interface LoadData {
  $oid: string;
  title?: string;
  pickupCity?: string;
  deliveryCity?: string;
  status?: string;
  fixedPrice?: number;
  createdAt?: string;
}