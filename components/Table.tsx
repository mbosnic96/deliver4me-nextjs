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

const Spinner = ({ size = "lg" }) => (
  <div
    className={`animate-spin rounded-full border-4 border-t-transparent border-gray-400 ${
      size === "lg" ? "h-8 w-8" : "h-4 w-4"
    }`}
  ></div>
);

interface TableProps<T> {
  title: string;
  columns: ColumnDef<T, any>[];
  apiBase: string;
  FormComponent: React.ComponentType<{
    initialData?: T;
    onClose: () => void;
    onSaved: () => void;
  }>;
  toggleActive?: boolean;
}

export function Table<T extends { id: string; isDeleted?: boolean }>({
  title,
  columns,
  apiBase,
  FormComponent,
  toggleActive = false,
}: TableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<T | undefined>(undefined);

const fetchData = async () => {
  setLoading(true);
  try {
    const res = await axios.get<T[]>(apiBase);
    const mapped = res.data.map((item: any) => ({
      ...item,
      id: item.id || item._id, 
    }));
    setData(mapped);
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Failed to fetch data", "error");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, [apiBase]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleToggle = async (row: T) => {
    const id = row.id;
    if (row.isDeleted === undefined) return;

    const action = row.isDeleted ? "activate" : "deactivate";

    try {
      if (row.isDeleted) {
        await axios.patch(`${apiBase}/${id}/restore`);
      } else {
        await axios.delete(`${apiBase}/${id}`);
      }
      Swal.fire("Success", `Item ${action}d`, "success");
      fetchData();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", `Failed to ${action} item`, "error");
    }
  };

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

    try {
      await axios.delete(`${apiBase}/${id}`);
      fetchData();
      Swal.fire("Deleted!", "Item has been deleted.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to delete item", "error");
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {title}
        </h2>
        <Button
          onClick={() => {
            setEditingRow(undefined);
            setDialogOpen(true);
          }}
        >
          Dodaj
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Akcije
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={
                    idx % 2 === 0
                      ? "bg-gray-50 dark:bg-gray-800"
                      : "bg-white dark:bg-gray-900"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRow(row.original);
                        setDialogOpen(true);
                      }}
                    >
                      Uredi
                    </Button>

                    {toggleActive && row.original.isDeleted !== undefined ? (
                      <Button
                        variant={row.original.isDeleted ? "default" : "destructive"}
                        size="sm"
                        onClick={() => handleToggle(row.original)}
                      >
                        {row.original.isDeleted ? "Aktiviraj" : "Deaktiviraj"}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(row.original.id)}
                      >
                        Briši
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    Nema podataka
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Uredi" : "Dodaj"}</DialogTitle>
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
