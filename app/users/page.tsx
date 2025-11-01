"use client";

import { Table } from "@/components/Table";
import { AddUserForm } from "@/components/AddUserForm";
import { ColumnDef } from "@tanstack/react-table";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, RefreshCcw, Eye } from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string;
  _id: string;
  name: string;
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
  const router = useRouter();

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Jeste li sigurni?",
      text: "Ova radnja se ne može poništiti!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Obriši",
      cancelButtonText: "Otkaži",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete user");
      toast.success("Korisnik uspješno deaktiviran!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Greška pri brisanju korisnika");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}/restore`, { method: "PATCH" });
      if (!response.ok) throw new Error("Failed to restore user");
      toast.success("Korisnik uspješno reaktiviran!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Greška pri reaktivaciji korisnika");
    }
  };

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "photoUrl",
      header: "Slika",
      cell: ({ row }) => (
        <img
          src={row.original.photoUrl || "/user.png"}
          alt="User"
          className="w-10 h-10 rounded-full object-cover"
        />
      ),
    },
    { accessorKey: "name", header: "Ime", cell: ({ row }) => (
      <div className="max-w-[120px] truncate" title={row.original.name}>{row.original.name}</div>
    ) },
    { accessorKey: "email", header: "Email", cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.original.email}>{row.original.email}</div>
    ) },
    { accessorKey: "role", header: "Uloga", cell: ({ row }) => (
      <div className="max-w-[100px] truncate" title={row.original.role}>{row.original.role}</div>
    ) },
    { accessorKey: "phone", header: "Telefon", cell: ({ row }) => (
      <div className="max-w-[140px] truncate" title={row.original.phone}>{row.original.phone}</div>
    ) },
    { accessorKey: "isDeleted", header: "Aktivan", cell: ({ row }) => (
      <span className={`inline-block w-3 h-3 rounded-full ${row.original.isDeleted ? "bg-red-500" : "bg-green-500"}`}></span>
    ) },
  ];

  const renderActions = (row: UserRow, edit: (row: UserRow) => void) => (
    <div className="flex flex-nowrap gap-2">
      <Button size="sm" onClick={() => router.push(`/users/${row._id}`)} className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2">
        <Eye className="h-4 w-4 mr-1" /> Vidi
      </Button>

      <Button variant="outline" size="sm" onClick={() => edit(row)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2">
        <Edit className="h-4 w-4 mr-1" /> Uredi
      </Button>

      {row.isDeleted ? (
        <Button variant="default" size="sm" onClick={() => handleRestore(row._id)} className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
          <RefreshCcw className="h-4 w-4 mr-1" /> Reaktiviraj
        </Button>
      ) : (
        <Button variant="destructive" size="sm" onClick={() => handleDelete(row._id)} className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
          <Trash2 className="h-4 w-4 mr-1" /> Deaktiviraj
        </Button>
      )}
    </div>
  );

  const additionalFilters = [
    {
      key: "role",
      label: "Uloga",
      options: [
        { value: "all", label: "Svi" },
        { value: "admin", label: "Admin" },
        { value: "client", label: "Klijent" },
        { value: "driver", label: "Vozač" },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <Sidebar
        role={role}
        navbarHeight={84}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main className={`flex-1 transition-all duration-300 min-h-screen ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
        <div className="p-4 md:p-6 h-full flex flex-col">
          <div className="rounded-lg shadow-sm flex-1 flex flex-col min-h-0">
            <Table<UserRow>
              title="Korisnici"
              description="Upravljajte korisnicima sistema"
              columns={columns}
              apiBase="/api/users"
              FormComponent={AddUserForm}
              showSearch
              searchPlaceholder="Pretraži korisnike..."
              additionalFilters={additionalFilters}
              renderActions={renderActions}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
