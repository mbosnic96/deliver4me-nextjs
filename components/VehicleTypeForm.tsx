"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VehicleTypeForm({
  initialData,
  onClose,
  onSaved
}: {
  initialData?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?._id) {
        await axios.patch(`/api/vehicle-types/${initialData._id}`, { name, description });
      } else {
        await axios.post("/api/vehicle-types", { name, description });
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Naziv
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Naziv tipa vozila"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Opis
        </label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opis vozila"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Otkaži
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Spremanje..." : "Sačuvaj"}
        </Button>
      </div>
    </form>
  );
}
