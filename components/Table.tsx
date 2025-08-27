"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Swal from "sweetalert2";

interface TableProps<T> {
  title: string;
  columns: ColumnDef<T, any>[];
  apiBase: string;
  FormComponent: React.ComponentType<{
    initialData?: T;
    onClose: () => void;
    onSaved: () => void;
  }>;
}

export function Table<T extends { _id: string }>({
  title,
  columns,
  apiBase,
  FormComponent,
}: TableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<T | undefined>(undefined);

  const fetchData = async () => {
    setLoading(true);
    const res = await axios.get<T[]>(apiBase);
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [apiBase]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    await axios.delete(`${apiBase}/${id}`);
    fetchData();
    Swal.fire("Deleted!", "Item has been deleted.", "success");
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button
          onClick={() => {
            setEditingRow(undefined);
            setDialogOpen(true);
          }}
        >
          Add New
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border border-gray-200">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-2 text-left border-b">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
                <th className="p-2 text-left border-b">Actions</th>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2 border-b">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                <td className="p-2 border-b space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRow(row.original);
                      setDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(row.original._id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <FormComponent
            initialData={editingRow}
            onClose={() => setDialogOpen(false)}
            onSaved={() => {
              setDialogOpen(false);
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
