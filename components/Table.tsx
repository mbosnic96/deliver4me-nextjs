"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { toast } from "react-toastify";

const Spinner = ({ size = "lg" }: { size?: "sm" | "lg" }) => (
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

const STATUS_OPTIONS = [
  { value: "Aktivan", label: "Aktivan", color: "#22c55e" },
  { value: "Poslan", label: "Poslan", color: "#3b82f6" },
  { value: "Dostavljen", label: "Dostavljen", color: "#6b7280" },
  { value: "Otkazan", label: "Otkazan", color: "#ef4444" },
];

interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export function Table<T extends { id: string; isDeleted?: boolean; status?: string }>({
  title,
  columns,
  apiBase,
  FormComponent,
  toggleActive = false,
}: TableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<T | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<"driver" | "admin" | "other">("other");
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalCount, setTotalCount] = useState(0);

  const shouldShowViewButton = apiBase === "/api/loads" || apiBase === "/api/users";

  const fetchUserRole = async () => {
    try {
      const res = await fetch("/api/users/me");
      const json = await res.json();
      setUserRole(json.role);
    } catch (error) {
      console.error("Failed to fetch user role", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = new URL(apiBase, window.location.origin);
      url.searchParams.set("page", (pagination.pageIndex + 1).toString());
      url.searchParams.set("limit", pagination.pageSize.toString());

      const res = await fetch(url.toString());
      const json: ApiResponse<T> = await res.json();

      const items = json.data || [];
      const mapped = items.map((item: any) => ({
        ...item,
        id: item.id || item._id,
      }));

      setData(mapped);
      setTotalCount(json.total || 0);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    fetchData();
  }, [apiBase, pagination.pageIndex, pagination.pageSize]);

  const handleToggle = async (row: T) => {
    if (row.isDeleted === undefined) return;
    const action = row.isDeleted ? "activate" : "deactivate";

    try {
      if (row.isDeleted) {
        await fetch(`${apiBase}/${row.id}/restore`, { method: "PATCH" });
      } else {
        await fetch(`${apiBase}/${row.id}`, { method: "DELETE" });
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
      await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      fetchData();
      Swal.fire("Deleted!", "Item has been deleted.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to delete item", "error");
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

  const renderCell = (cell: any) => {
    if (cell.column.columnDef.accessorKey === "status") {
      const rowId = cell.row.original.id;
      const saving = savingStatus[rowId] || false;
      const value = cell.getValue() as string;

      const handleChange = async (option: any) => {
        setSavingStatus((prev) => ({ ...prev, [rowId]: true }));
        try {
          await fetch(`${apiBase}/${rowId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: option.value }),
          });
          toast.success(`Status updated to "${option.value}"`);
          await fetchData();
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "Failed to update status", "error");
        } finally {
          setSavingStatus((prev) => ({ ...prev, [rowId]: false }));
        }
      };

      return (
        <div className="flex items-center gap-2">
          <Select
            value={STATUS_OPTIONS.find((s) => s.value === value)}
            options={STATUS_OPTIONS}
            onChange={handleChange}
            isDisabled={saving}
            className="w-40"
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            styles={{
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isSelected ? state.data.color : provided.backgroundColor,
                color: state.isSelected ? "#fff" : "#000",
              }),
              singleValue: (provided, state) => ({
                ...provided,
                color: STATUS_OPTIONS.find((s) => s.value === value)?.color,
                fontWeight: "bold",
              }),
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
          {saving && <Spinner size="sm" />}
        </div>
      );
    }

    return flexRender(cell.column.columnDef.cell, cell.getContext());
  };

  const getViewRoute = (row: T) => {
    if (apiBase === "/api/loads") {
      return `/load/${row.id}`;
    } else if (apiBase === "/api/users") {
      return `/users/${row.id}`;
    }
    return "#";
  };

  const renderActions = (row: T) => {
    return (
      <>
        {shouldShowViewButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(getViewRoute(row))}
          >
            View
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingRow(row);
            setDialogOpen(true);
          }}
        >
          Uredi
        </Button>
        {toggleActive && row.isDeleted !== undefined ? (
          <Button
            variant={row.isDeleted ? "default" : "destructive"}
            size="sm"
            onClick={() => handleToggle(row)}
          >
            {row.isDeleted ? "Aktiviraj" : "Deaktiviraj"}
          </Button>
        ) : (
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.id)}>
            Briši
          </Button>
        )}
      </>
    );
  };

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        {userRole !== "driver" && (
          <Button
            onClick={() => {
              setEditingRow(undefined);
              setDialogOpen(true);
            }}
          >
            Dodaj
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-4">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
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
                    className={idx % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                      >
                        {renderCell(cell)}
                      </td>
                    ))}
                    <td className="px-4 py-3 flex flex-wrap gap-2">{renderActions(row.original)}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      Nema podataka
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

         
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <select
                className="border rounded p-1 text-sm dark:bg-gray-800 dark:text-gray-200"
                value={pagination.pageSize}
                onChange={(e) => {
                  setPagination(prev => ({
                    ...prev,
                    pageSize: Number(e.target.value),
                    pageIndex: 0 
                  }));
                }}
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                Last
              </Button>
            </div>

            <span className="text-sm text-gray-700 dark:text-gray-300">
              Total: {totalCount} items
            </span>
          </div>
        </>
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