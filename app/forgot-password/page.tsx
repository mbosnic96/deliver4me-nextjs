'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error sending email');

      await Swal.fire({
        icon: 'success',
        title: 'Email poslan!',
        text: 'Provjerite vaš inbox za reset link.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6',
      });

      router.push('/');
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Greška!',
        text: err.message || 'Došlo je do greške prilikom slanja emaila.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="p-8 content-bg rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4">Zaboravljena lozinka</h2>
        <input
          type="email"
          placeholder="Unesite vaš email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-700 text-white rounded hover:bg-blue-700 transition"
        >
          {loading ? 'Slanje...' : 'Pošalji link za reset'}
        </button>
      </form>
    </div>
  );
}
