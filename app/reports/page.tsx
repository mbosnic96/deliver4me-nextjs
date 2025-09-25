"use client";

import { Table } from "@/components/Table";
import { ColumnDef } from "@tanstack/react-table";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Flag, Calendar, User, Truck, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Report = {
  id: string;
  _id: string;
  reporterId: { name: string; userName: string };
  reportedUserId: { name: string; userName: string };
  loadId?: { title: string; _id: string };
  reportType: string;
  description: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  createdAt: string;
  evidence: string[];
};

const ReportsPage = () => {
  const { data: session } = useSession();
  const role = session?.user?.role as "client" | "driver" | "admin" | undefined;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: "reporterId",
      header: "Prijavio",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-500" />
          <div>
            <div className="font-medium">{row.original.reporterId.name}</div>
            <div className="text-sm text-gray-500">@{row.original.reporterId.userName}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "reportedUserId",
      header: "Prijavljen",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-red-500" />
          <div>
            <div className="font-medium">{row.original.reportedUserId.name}</div>
            <div className="text-sm text-gray-500">@{row.original.reportedUserId.userName}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "loadId",
      header: "Teret",
      cell: ({ row }) =>
        row.original.loadId ? (
          <div className="flex items-center space-x-2">
            <Truck className="h-4 w-4 text-blue-500" />
            <Link
              href={`/load/${row.original.loadId._id}`}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
              target="_blank"
            >
              {row.original.loadId.title}
            </Link>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Nema tereta</span>
        ),
    },
    {
      accessorKey: "reportType",
      header: "Tip prijave",
      cell: ({ row }) => {
        const typeLabels: Record<string, string> = {
          spam: "Spam",
          inappropriate_content: "Neprikladan sadržaj",
          fraud: "Prevara",
          harassment: "Uznemiravanje",
          fake_profile: "Lažni profil",
          other: "Ostalo",
        };
        return (
          <div className="flex items-center space-x-2">
            <Flag className="h-4 w-4 text-orange-500" />
            <span>{typeLabels[row.original.reportType] || row.original.reportType}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusConfig = {
          pending: { label: "Na čekanju", color: "bg-yellow-100 text-yellow-800" },
          under_review: { label: "U pregledu", color: "bg-blue-100 text-blue-800" },
          resolved: { label: "Riješeno", color: "bg-green-100 text-green-800" },
          dismissed: { label: "Odbijeno", color: "bg-red-100 text-red-800" },
        };
        const config = statusConfig[row.original.status];
        return (
          <div className="flex items-center space-x-2">
            <Badge className={config.color}>{config.label}</Badge>
            
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Datum",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            {new Date(row.original.createdAt).toLocaleDateString("bs-BA")}
          </span>
        </div>
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
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        <div className="p-4 md:p-6 h-full flex flex-col">
          <div className="rounded-lg shadow-sm flex-1 flex flex-col min-h-0">
          <Table<Report>
            title="Prijave korisnika"
            description="Upravljajte prijavama korisnika za spam, prevaru i druge prekršaje"
            columns={columns}
            apiBase="/api/reports"
            showSearch={true}
            searchPlaceholder="Pretraži prijave..."
            additionalFilters={[
              {
                key: "status",
                label: "Status",
                options: [
                  { value: "all", label: "Svi statusi" },
                  { value: "pending", label: "Na čekanju" },
                  { value: "under_review", label: "U pregledu" },
                  { value: "resolved", label: "Riješeno" },
                  { value: "dismissed", label: "Odbijeno" },
                ],
              },
              {
                key: "reportType",
                label: "Tip prijave",
                options: [
                  { value: "all", label: "Svi tipovi" },
                  { value: "spam", label: "Spam" },
                  { value: "inappropriate_content", label: "Neprikladan sadržaj" },
                  { value: "fraud", label: "Prevara" },
                  { value: "harassment", label: "Uznemiravanje" },
                  { value: "fake_profile", label: "Lažni profil" },
                  { value: "other", label: "Ostalo" },
                ],
              },
            ]}
            renderActions={(row) => (
              <div className="flex space-x-2">
                <Link href={`/reports/${row._id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Detalji
                  </Button>
                </Link>
              </div>
            )}
          />
        </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
