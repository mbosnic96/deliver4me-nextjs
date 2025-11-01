"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

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

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Naziv je obavezan");
      return;
    }

    setLoading(true);
    
    try {
      const url = initialData?._id 
        ? `/api/vehicle-types/${initialData._id}`
        : "/api/vehicle-types";
      
      const method = initialData?._id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save vehicle type");
      }

      toast.success(initialData?._id ? "Tip vozila ažuriran!" : "Tip vozila kreiran!");
      onSaved();
      onClose();
    } catch (error: any) {
      console.error("Error saving vehicle type:", error);
      toast.error(error.message || "Greška pri spremanju tipa vozila");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Naziv</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Naziv tipa vozila"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Opis</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opis vozila"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
          Otkaži
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Spremanje...
            </>
          ) : (
            initialData?._id ? "Ažuriraj" : "Sačuva"
          )}
        </Button>
      </div>
    </form>
  );
}