export interface Vehicle {
  id?: string;              
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
  createdAt: string;
}
