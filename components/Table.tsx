"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { Pagination } from "./Pagination";

const Spinner = ({ size = "lg" }: { size?: "sm" | "lg" }) => (
  <div
    className={`animate-spin rounded-full border-4 border-t-transparent border-gray-400 ${
      size === "lg" ? "h-8 w-8" : "h-4 w-4"
    }`}
  ></div>
);

interface TableProps<T> {
  title: string;
  description?: string;
  columns: ColumnDef<T, any>[];
  apiBase: string;
  FormComponent?: React.ComponentType<{
    initialData?: T;
    onClose: () => void;
    onSaved: () => void;
  }>;
  showSearch?: boolean;
  searchPlaceholder?: string;
  additionalFilters?: Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
  renderActions?: (
    row: T,
    edit: (row: T) => void,
    remove: (id: string) => void
  ) => React.ReactNode;
}

interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export function Table<T extends { id: string }>({
  title,
  description,
  columns,
  apiBase,
  FormComponent,
  showSearch = false,
  searchPlaceholder = "Search...",
  additionalFilters = [],
  renderActions,
}: TableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<T | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [userRole, setUserRole] = useState<"driver" | "admin" | "other">("other");

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalCount, setTotalCount] = useState(0);

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

      if (searchTerm) {
        url.searchParams.set("search", searchTerm);
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        }
      });

      const res = await fetch(url.toString());
      const json: ApiResponse<T> = await res.json();

      const items = (json.data || []).map((item: any) => ({
        ...item,
        id: item.id || item._id,
      }));

      setData(items);
      setTotalCount(json.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    fetchData();
  }, [apiBase, pagination.pageIndex, pagination.pageSize, searchTerm, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== "") {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  });

const handleFilterChange = (key: string, value: string) => {
  setFilters((prev) => ({
    ...prev,
    [key]: value === "all" ? "" : value,  
  }));
  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
};


  const clearFilters = () => {
    setSearchTerm("");
    setFilters({});
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {title}
          </h2>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>

        {FormComponent && (
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

      {(showSearch || additionalFilters.length > 0) && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {showSearch && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {(searchTerm || Object.values(filters).some((v) => v)) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {additionalFilters.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {additionalFilters.map((filter) => (
                <div key={filter.key} className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select
                    value={filters[filter.key] || ""}
                    onValueChange={(value) => handleFilterChange(filter.key, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value || "all"}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                    {renderActions && (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                        Akcije
                      </th>
                    )}
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
                        className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    {renderActions && (
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {renderActions(
                          row.original,
                          (rowData) => {
                            setEditingRow(rowData);
                            setDialogOpen(true);
                          },
                          (id) => {
                            setData((prev) => prev.filter((item) => item.id !== id));
                          }
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + (renderActions ? 1 : 0)}
                      className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      Nema podataka
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

         <Pagination
  currentPage={pagination.pageIndex + 1}
  totalPages={table.getPageCount()}
  onPageChange={(page) =>
    setPagination((prev) => ({
      ...prev,
      pageIndex: page - 1, 
    }))
  }
/>

        </>
      )}
  
      {FormComponent && (
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
      )}
    </div>
  );
}
