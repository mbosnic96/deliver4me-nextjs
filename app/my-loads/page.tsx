"use client";

import { Table } from "@/components/Table";
import { LoadForm } from "@/components/LoadForm";
import { ColumnDef } from "@tanstack/react-table";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

type Load = {
  id: string;
  userId: string;
  title: string;
  description: string;
  status?: "aktivan" | "poslan" | "dostavljen" | "otkazan";
  pickupCountry?: string;
  pickupState?: string;
  pickupCity?: string;
  deliveryCountry?: string;
  deliveryState?: string;
  deliveryCity?: string;
  cargoWeight?: number;
  cargoWidth?: number;
  cargoHeight?: number;
  cargoLength?: number;
  preferredPickupDate?: string;
  preferredDeliveryDate?: string;
};

export default function MyLoadsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as "client" | "driver" | "admin" | undefined;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/loads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      toast.success(`Status ažuriran na "${newStatus}"`);
    } catch (error) {
      console.error(error);
      toast.error("Greška pri ažuriranju statusa");
    }
  };

  const columns: ColumnDef<Load>[] = [
    { 
      accessorKey: "title", 
      header: "Naziv",
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate" title={row.original.title}>
          {row.original.title}
        </div>
      )
    },
    { 
      accessorKey: "description", 
      header: "Opis",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.description}>
          {row.original.description}
        </div>
      )
    },
    {
      accessorKey: "dimensions",
      header: "Dimenzije (ŠxVxD kg)",
      cell: ({ row }) => {
        const r = row.original;
        return `${r.cargoWidth || "-"} x ${r.cargoHeight || "-"} x ${r.cargoLength || "-"} / ${r.cargoWeight || "-"}kg`;
      },
    },
    {
      accessorKey: "pickupCountry",
      header: "Pickup Location",
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          {row.original.pickupCountry || "-"} / {row.original.pickupState || "-"} / {row.original.pickupCity || "-"}
        </div>
      ),
    },
    {
      accessorKey: "deliveryCountry",
      header: "Delivery Location",
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          {row.original.deliveryCountry || "-"} / {row.original.deliveryState || "-"} / {row.original.deliveryCity || "-"}
        </div>
      ),
    },
    {
      accessorKey: "pickupTime",
      header: "Pickup Time",
      cell: ({ row }) => row.original.preferredPickupDate?.slice(0, 16).replace("T", " ") || "-",
    },
    {
      accessorKey: "deliveryTime",
      header: "Delivery Time",
      cell: ({ row }) => row.original.preferredDeliveryDate?.slice(0, 16).replace("T", " ") || "-",
    },
{
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const dbStatus = (row.original.status || "").toLowerCase(); 
    
    // Prevent editing if in final state
    if (["dostavljen", "otkazan"].includes(dbStatus)) {
      return (
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          dbStatus === "dostavljen" ? "bg-green-100 text-green-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {dbStatus}
        </div>
      );
    }

    return (
      <Select
        value={dbStatus}
        onValueChange={(value) => handleStatusChange(row.original.id, value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="aktivan">Aktivan</SelectItem>
          <SelectItem value="poslan">Poslan</SelectItem>
          <SelectItem value="dostavljen">Dostavljen</SelectItem>
          <SelectItem value="otkazan">Otkazan</SelectItem>
        </SelectContent>
      </Select>
    );
  },
},
  ];

  const additionalFilters = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "all", label: "Svi" },
        { value: "aktivan", label: "Aktivan" },
        { value: "poslan", label: "Poslan" },
        { value: "dostavljen", label: "Dostavljen" },
        { value: "otkazan", label: "Otkazan" },
      ],
    },
  ];

  const renderActions = (row: Load, edit: (row: Load) => void) => {
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
        const response = await fetch(`/api/loads/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete load");
        toast.success("Teret uspješno obrisan!");
        window.location.reload();
      } catch (error) {
        console.error(error);
        toast.error("Greška pri brisanju tereta");
      }
    };

    const router = useRouter();


    return (
  <div className="flex gap-2 items-center">
    <Button size="sm" onClick={() => router.push(`/load/${row.id}`)} className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2">
      <Eye className="h-4 w-4 mr-1" />
      Vidi
    </Button>

    {role !== "driver" && (
      <>
        <Button size="sm" onClick={() => edit(row)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2">
          <Edit className="h-4 w-4 mr-1" />
          Uredi
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleDelete(row.id)}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Briši
        </Button>
      </>
    )}
  </div>
);
  }


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
            <Table<Load>
              title="Moji tereti"
              columns={columns}
              apiBase="/api/loads"
              FormComponent={LoadForm}
              showSearch
              searchPlaceholder="Pretraži terete..."
              additionalFilters={additionalFilters}
              renderActions={renderActions}
            />
          </div>
        </div>
      </main>
    </div>
  );
}