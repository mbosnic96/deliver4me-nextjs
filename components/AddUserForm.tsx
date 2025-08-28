"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";

interface Props {
  initialData?: {
    _id: string;
    name: string;
    userName: string;
    email: string;
    role: "client" | "driver" | "admin";
  };
  onClose: () => void;
  onSaved: () => void;
}

export function AddUserForm({ initialData, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"client" | "driver" | "admin">("client");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setUserName(initialData.userName || "");
      setEmail(initialData.email || "");
      setRole(initialData.role || "client");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that role has a value
    if (!role) {
      Swal.fire("Greška", "Molimo odaberite ulogu", "error");
      return;
    }
    
    setLoading(true);

    try {
      const userData = { 
        name, 
        userName, 
        email, 
        role 
      };
      

      if (initialData) {
        await axios.put(`/api/users/${initialData._id}`, userData);
        Swal.fire("Uspjeh", "Korisnik uspješno ažuriran", "success");
      } else {
        await axios.post("/api/users", userData);
        Swal.fire("Uspjeh", "Korisnik uspješno dodan", "success");
      }
      onSaved();
    } catch (err: any) {
      console.error("Error details:", err.response?.data);
      Swal.fire(
        "Greška",
        err?.response?.data?.error || "Greška pri spremanju korisnika",
        "error"
      );
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
        <label>Korisničko ime</label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
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
        <Button type="button" onClick={onClose} variant="outline">
          Otkaži
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Spremanje..." : initialData ? "Ažuriraj korisnika" : "Dodaj korisnika"}
        </Button>
      </div>
    </form>
  );
}