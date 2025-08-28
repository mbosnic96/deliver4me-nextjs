export interface FullUserDto {
  id: string;
  name: string;
  userName: string;
  email: string;
  phone?: string;
  role: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  isDeleted: !!user.isDeleted
}

export interface EditUserDto {
  name: string;
  userName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  photoUrl?: string | null;
  updatedAt?: Date;
  role?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateUserLocationDto {
  latitude: number;
  longitude: number;
}