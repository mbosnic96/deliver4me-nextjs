"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";

interface Props {
  initialData?: {
    _id: string;
    name: string;
    email: string;
    role: "client" | "driver" | "admin";
  };
  onClose: () => void;
  onSaved: () => void;
}

export function AddUserForm({ initialData, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"client" | "driver" | "admin">("client");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setRole(initialData.role || "client");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userData = { name, email, role };

    try {
      let res;
      if (initialData) {
        res = await fetch(`/api/users/${initialData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        if (!res.ok) throw await res.json();
        Swal.fire({
          title: "Uspjeh",
          text: "Korisnik uspješno ažuriran",
          icon: "success",
          customClass: { popup: "pointer-events-auto" },
        });
      } else {
        res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        if (!res.ok) throw await res.json();
        Swal.fire({
          title: "Uspjeh",
          text: "Korisnik uspješno dodan",
          icon: "success",
          customClass: { popup: "pointer-events-auto" },
        });
      }

      onSaved();
    } catch (err: any) {
      console.error("Error details:", err?.error || err);
      Swal.fire({
        title: "Greška",
        text: err?.error || "Greška pri spremanju korisnika",
        icon: "error",
        customClass: { popup: "pointer-events-auto" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Ime</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <div>
        <label>Uloga</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "client" | "driver" | "admin")}
          required
          className="w-full border px-3 py-2 rounded"
        >
          <option value="client">Klijent</option>
          <option value="driver">Vozač</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onClose} variant="outline" className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
          Otkaži
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2">
          {loading ? "Spremanje..." : initialData ? "Ažuriraj korisnika" : "Dodaj korisnika"}
        </Button>
      </div>
    </form>
  );
}
