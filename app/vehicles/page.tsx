"use client";

import { Table } from "@/components/Table";
import { VehicleForm } from "@/components/VehicleForm";
import { ColumnDef } from "@tanstack/react-table";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

type Vehicle = {
  id: string;
  _id: string;
  brand: string;
  model: string;
  plateNumber: string;
  width: number;
  length: number;
  height: number;
  volume: number;
  vehicleType?: { name: string };
  createdAt: string;
  cargoPercentage: number;
};

export default function VehiclesPage() {
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
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete vehicle");

      toast.success("Vozilo uspješno obrisano!");
    } catch (error) {
      console.error(error);
      toast.error("Greška pri brisanju vozila");
    }
  };

  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: "model",
      header: "Model",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.model}</div>
      ),
    },
    {
      accessorKey: "brand",
      header: "Marka",
      cell: ({ row }) => <div>{row.original.brand}</div>,
    },
    {
      accessorKey: "plateNumber",
      header: "Registracija",
      cell: ({ row }) => <div>{row.original.plateNumber}</div>,
    },
    {
      accessorKey: "dimensions",
      header: "Dimenzije (m)",
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div>
            {v.width} x {v.length} x {v.height}
          </div>
        );
      },
    },
    {
      accessorKey: "volume",
      header: "Zapremina (m³)",
      cell: ({ row }) => (
        <div>{row.original.volume.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "cargoPercentage",
      header: "Popunjeno prostora (%)",
      cell: ({ row }) => (
        <div>{row.original.cargoPercentage.toFixed(2)}</div>
      ),
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

      <main 
        className={`flex-1 transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <div className="p-4 md:p-6 h-full flex flex-col">
          <div className="rounded-lg shadow-sm flex-1 flex flex-col min-h-0">
            <Table<Vehicle>
              title="Moja vozila"
              description="Pregled i upravljanje vašim vozilima"
              columns={columns}
              apiBase="/api/vehicles"
              FormComponent={VehicleForm}
              showSearch={true}
              searchPlaceholder="Pretraži vozila..."
              renderActions={(row, edit, remove) => (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => edit(row)}
                  >
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
