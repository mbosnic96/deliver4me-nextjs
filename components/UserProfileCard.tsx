"use client";

import Image from "next/image";
import { FullUserDto } from "@/lib/types/user";

interface UserProfileCardProps {
  user: FullUserDto;
}

export default function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row gap-6">
      <div className="flex-shrink-0">
        <div className="w-32 h-32 relative rounded-full overflow-hidden border">
          <Image
            src={user.photoUrl || "/user.png"}
            alt={user.name}
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-2xl font-bold">{user.name}</h2>
        <p className="text-gray-500 mb-2">@{user.userName}</p>

        {user.email && <p className="text-gray-600 mb-1">Email: {user.email}</p>}
        {user.phone && <p className="text-gray-600 mb-1">Telefon: {user.phone}</p>}
        {user.address && <p className="text-gray-600 mb-1">Adresa: {user.address}</p>}

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mt-2">
          <div>Grad: {user.city || "-"}</div>
          <div>Država: {user.country || "-"}</div>
          <div>Regija: {user.state || "-"}</div>
          <div>Poštanski broj: {user.postalCode || "-"}</div>
        </div>
      </div>
    </div>
  );
}
