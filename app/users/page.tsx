"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Sidebar from "@/components/Sidebar";
import { Table } from "@/components/Table";
import { AddUserForm } from "@/components/AddUserForm";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, RefreshCcw } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

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
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      toast.success("Korisnik uspješno deaktiviran!");
    } catch (error) {
      console.error(error);
      toast.error("Greška pri brisanju korisnika");
    }
  };

  const handleRestore = async (id: string) => {
  try {
    const response = await fetch(`/api/users/${id}/restore`, {
      method: "PATCH",
    });

    if (!response.ok) throw new Error("Failed to restore user");

    toast.success("Korisnik uspješno reaktiviran!");
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
  <div className="flex min-h-screen">
      <Sidebar
        role={role}
        navbarHeight={84}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main 
        className={`flex-1 transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <div className="p-4 md:p-6 h-full flex flex-col">
          <div className="rounded-lg shadow-sm flex-1 flex flex-col min-h-0">
          <Table<UserRow>
            title="Korisnici"
            description="Upravljajte korisnicima sistema"
            columns={columns}
            apiBase="/api/users"
            FormComponent={AddUserForm}
            showSearch={true}
            searchPlaceholder="Pretraži korisnike..."
             additionalFilters={[
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
            ]}
         renderActions={(row, edit, remove) => (
  <div className="flex space-x-2">
    <Button variant="outline" size="sm" onClick={() => edit(row)}>
      <Edit className="h-4 w-4 mr-1" />
      Uredi
    </Button>

    {row.isDeleted ? (
      <Button
        variant="default"
        size="sm"
        onClick={() => handleRestore(row._id)}
      >
         <RefreshCcw className="h-4 w-4 mr-1" />
        Reaktiviraj
      </Button>
    ) : (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleDelete(row._id)}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Deaktiviraj
      </Button>
    )}
  </div>
)}

          />
        </div>
        </div>
      </main>
    </div>
  );
}
