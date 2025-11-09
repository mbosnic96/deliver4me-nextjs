"use client";

import { Table } from "@/components/Table";
import { LoadForm } from "@/components/LoadForm";
import { ColumnDef } from "@tanstack/react-table";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { createNotification } from "@/lib/notifications";

type Load = {
  id: string;
  userId: string;
  title: string;
  description: string;
  status?: string;
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
  driverConfirmedDelivery?: boolean;
  clientConfirmedDelivery?: boolean;
  driverConfirmedAt?: string;
  clientConfirmedAt?: string;
  assignedBidId?: string;
};

type Bid = {
  _id: string;
  driverId: string;
};

export default function MyLoadsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as "client" | "driver" | "admin" | undefined;
  const userId = session?.user?.id;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleStatusChange = async (id: string, newStatus: string, load: Load) => {
    try {
      const response = await fetch(`/api/loads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || "Greška pri ažuriranju statusa");
        return;
      }
      
      if (result.awaitingClientConfirmation) {
        await createNotification(
          load.userId,
          `Vozač je označio teret "${load.title}" kao dostavljen. Molimo potvrdite dostavu.`,
          `/my-loads`
        );
        toast.info("Dostava potvrđena. Čeka se potvrda od klijenta.");
      } else if (newStatus === "otkazan" || newStatus === "Otkazan" || newStatus === "canceled") {
        if (load.assignedBidId) {
          const bidRes = await fetch(`/api/bids/${load.assignedBidId}`);
          if (bidRes.ok) {
            const bid: Bid = await bidRes.json();
            const canceledBy = role === "driver" ? "vozača" : "klijenta";
            const notifyUserId = role === "driver" ? load.userId : bid.driverId;
            
            await createNotification(
              notifyUserId,
              `Teret "${load.title}" je otkazan od strane ${canceledBy}.`,
              `/load/${id}`
            );
          }
        }
        toast.success(result.message || "Teret otkazan");
      } else {
        toast.success(result.message || `Status ažuriran na "${newStatus}"`);
      }
      
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Greška pri ažuriranju statusa");
    }
  };

 const handleClientConfirmDelivery = async (id: string, load: Load) => {
    const result = await Swal.fire({
      title: "Potvrdite dostavu",
      text: "Da li ste sigurni da je teret dostavljen? Ova radnja će osloboditi sredstva vozaču. Ne zaboravite ocijeniti vozača na stranici tereta!",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Potvrdi dostavu",
      cancelButtonText: "Otkaži",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/loads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmDelivery: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Greška pri potvrdi dostave");
        return;
      }

      if (load.assignedBidId) {
        const bidRes = await fetch(`/api/bids/${load.assignedBidId}`);
        console.log("Bid response status:", bidRes.status);
        
        if (bidRes.ok) {
          const bid: Bid = await bidRes.json();
          try {
            await createNotification(
              bid.driverId.toString(),
              `Klijent je potvrdio dostavu tereta "${load.title}". Plaćanje je izvršeno!`,
              `/load/${id}`
            );
          } catch (notifError) {
            console.error("Error sending notification:", notifError);
          }
        } else {
          console.error("Failed to fetch bid:", await bidRes.text());
        }
      } else {
        console.log("No assignedBidId found");
      }

      toast.success(data.message || "Dostava potvrđena i plaćanje izvršeno!");
      window.location.reload();
    } catch (error) {
      console.error("Error in handleClientConfirmDelivery:", error);
      toast.error("Greška pri potvrdi dostave");
    }
  };
  const columns: ColumnDef<Load>[] = [
    { 
      accessorKey: "title", 
      header: "Naziv",
      cell: ({ row }) => (
        <div className="max-w-[100px] truncate" title={row.original.title}>
          {row.original.title}
        </div>
      )
    },
    { 
      accessorKey: "description", 
      header: "Opis",
      cell: ({ row }) => (
        <div className="max-w-[100px] truncate" title={row.original.description}>
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
      header: "Preuzimanje",
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          {row.original.pickupCountry || "-"} / {row.original.pickupState || "-"} / {row.original.pickupCity || "-"}
        </div>
      ),
    },
    {
      accessorKey: "deliveryCountry",
      header: "Dostavljanje",
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          {row.original.deliveryCountry || "-"} / {row.original.deliveryState || "-"} / {row.original.deliveryCity || "-"}
        </div>
      ),
    },
    {
      accessorKey: "pickupTime",
      header: "Vrijeme preuzimanja",
      cell: ({ row }) => row.original.preferredPickupDate?.slice(0, 16).replace("T", " ") || "-",
    },
    {
      accessorKey: "deliveryTime",
      header: "Vrijeme dostavljanja",
      cell: ({ row }) => row.original.preferredDeliveryDate?.slice(0, 16).replace("T", " ") || "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const load = row.original;
        const dbStatus = (load.status || "").toLowerCase();
        const isOwner = load.userId === userId;
        
        if (isOwner && load.driverConfirmedDelivery && !load.clientConfirmedDelivery) {
          return (
            <Button
              size="sm"
              onClick={() => handleClientConfirmDelivery(load.id, load)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Potvrdi dostavu
            </Button>
          );
        }

        if (["dostavljen", "otkazan"].includes(dbStatus)) {
          return (
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              dbStatus === "dostavljen" ? "bg-green-100 text-green-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {dbStatus === "dostavljen" ? "✓ Dostavljen" : "✗ Otkazan"}
            </div>
          );
        }

        if (dbStatus.includes("čekanju")) {
          return (
            <div className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              Čeka potvrdu klijenta
            </div>
          );
        }

        return (
          <Select
            value={dbStatus}
            onValueChange={(value) => handleStatusChange(load.id, value, load)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aktivan">Aktivan</SelectItem>
              <SelectItem value="poslan">Poslan</SelectItem>
              {role === "driver" && <SelectItem value="dostavljen">Dostavljen</SelectItem>}
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
        <Button 
          size="sm" 
          onClick={() => router.push(`/load/${row.id}`)} 
          className="bg-blue-700 hover:bg-blue-800 text-white"
        >
          <Eye className="h-4 w-4 mr-1" />
          Vidi
        </Button>

        {role !== "driver" && (
          <>
            <Button 
              size="sm" 
              onClick={() => edit(row)} 
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Edit className="h-4 w-4 mr-1" />
              Uredi
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(row.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Briši
            </Button>
          </>
        )}
      </div>
    );
  };

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
              title="Tereti"
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