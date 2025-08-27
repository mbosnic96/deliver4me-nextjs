"use client";

import { Table } from "@/components/Table";
import { VehicleTypeForm } from "@/components/VehicleTypeForm";
import { ColumnDef } from "@tanstack/react-table";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { useState } from "react";

type VehicleType = {
  _id: string;
  name: string;
  description: string;
};

const columns: ColumnDef<VehicleType>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" }
];

export default function VehicleTypesPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as "client" | "driver" | "admin" | undefined;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen cntainer mx-auto">
      <Sidebar
        role={role}
        navbarHeight={64}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main className={`flex-1 transition-all duration-300 mt-[70px] ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-4 md:p-6">
          <Table<VehicleType>
            title="Vehicle Types"
            columns={columns}
            apiBase="/api/vehicle-types"
            FormComponent={VehicleTypeForm}
          />
        </div>
      </main>
    </div>
  );
}
