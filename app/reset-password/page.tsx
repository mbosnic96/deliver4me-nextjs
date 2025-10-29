'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { signIn } from 'next-auth/react';

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Lozinka mora imati najmanje 8 karaktera.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Lozinke se ne podudaraju.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Greška pri resetovanju lozinke.');

      // Automatski login nakon resetovanja
      const loginRes = await signIn('credentials', { redirect: false, email: data.email, password });
      if (loginRes?.error) {
        toast.success('Lozinka je uspješno resetovana! Prijavite se ručno.');
        router.push('/login');
        return;
      }

      toast.success('Lozinka je uspješno resetovana! Uspješno ste prijavljeni.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Došlo je do greške. Pokušajte ponovo.');
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
        <h2 className="text-xl font-bold mb-4">Resetujte Lozinku</h2>
        <input
          type="password"
          placeholder="Nova lozinka"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="password"
          placeholder="Potvrdite novu lozinku"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {loading ? 'Spremanje...' : 'Resetuj Lozinku'}
        </button>
      </form>
    </div>
  );
}
