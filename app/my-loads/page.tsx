"use client";

import { Table } from "@/components/Table";
import { ColumnDef } from "@tanstack/react-table";
import { LoadForm } from "@/components/LoadForm";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button"; 

type Load = {
  id: string;
  title: string;
  description: string;
  status?: string;
};

const columns: ColumnDef<Load>[] = [
  { accessorKey: "title", header: "Naziv" },
  { accessorKey: "description", header: "Opis" },
  { accessorKey: "status", header: "Status" }
];

export default function MyLoadsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as "client" | "driver" | "admin" | undefined;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen container mx-auto">
      <Sidebar
        role={role}
        navbarHeight={84}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <div className="p-4 md:p-6">
          <Table<Load>
            title="Moji tereti"
            columns={columns}
            apiBase="/api/loads"
            FormComponent={LoadForm}
          />
        </div>
      </main>
    </div>
  );
}
