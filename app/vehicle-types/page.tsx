"use client";

import { Table } from "@/components/Table";
import { VehicleTypeForm } from "@/components/VehicleTypeForm";
import { ColumnDef } from "@tanstack/react-table";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

type VehicleType = {
  id: string;
  _id: string;
  name: string;
  description: string;
};

export default function VehicleTypesPage() {
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
      const response = await fetch(`/api/vehicle-types/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete vehicle type");

      toast.success("Tip vozila uspješno obrisan!");
    } catch (error) {
      console.error(error);
      toast.error("Greška pri brisanju tipa vozila");
    }
  };

  const columns: ColumnDef<VehicleType>[] = [
    {
      accessorKey: "name",
      header: "Naziv",
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "description",
      header: "Opis",
      cell: ({ row }) => (
        <div className="text-gray-600">{row.original.description}</div>
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
          <Table<VehicleType>
            title="Tipovi vozila"
            description="Upravljajte vrstama vozila u sistemu"
            columns={columns}
            apiBase="/api/vehicle-types"
            FormComponent={VehicleTypeForm}
            showSearch={true}
            searchPlaceholder="Pretraži tipove vozila..."
            renderActions={(row, edit, remove) => (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => edit(row)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Uredi
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(row._id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Briši
                </Button>
              </div>
            )}
          />
        </div>
        </div>
      </main>
    </div>
  );
}
