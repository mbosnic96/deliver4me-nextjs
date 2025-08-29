"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Sidebar from "@/components/Sidebar";
import { Table } from "@/components/Table";
import { AddUserForm } from "@/components/AddUserForm";

type UserRow = {
  id: string; 
  _id: string;
  name: string;
  userName: string;
  email: string;
  role: "client" | "driver" | "admin";
  phone: string;
  photoUrl: string;
  isDeleted: boolean;
};


export default function UsersPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as "client" | "driver" | "admin" | undefined;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl font-semibold">Access denied</p>
      </div>
    );
  }

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "photoUrl",
      header: "Slika",
      cell: ({ row }) => (
        <img
          src={row.original.photoUrl}
          alt="User"
          className="w-10 h-10 rounded-full object-cover"
        />
      ),
    },
    { accessorKey: "name", header: "Ime" },
    { accessorKey: "userName", header: "Korisničko ime" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Uloga" },
    { accessorKey: "phone", header: "Telefon" },
    {
      accessorKey: "isDeleted",
      header: "Aktivan",
      cell: ({ row }) => (
        <span
          className={`inline-block w-3 h-3 rounded-full ${
            row.original.isDeleted ? "bg-red-500" : "bg-green-500"
          }`}
        ></span>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen container mx-auto">
      <Sidebar
        role={role}
        navbarHeight={84}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <div className="p-4 md:p-6">
         <Table<UserRow>
  title="Users"
  columns={columns}
  apiBase="/api/users"
  FormComponent={AddUserForm}
  toggleActive={true} 
/>
        </div>
      </main>
    </div>
  );
}
