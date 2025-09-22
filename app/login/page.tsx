'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { signIn, getSession } from 'next-auth/react';

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const [error, setError] = useState('');
  const router = useRouter();

  const onSubmit = async (data: LoginFormData) => {
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (res?.error) {
      setError(res.error || 'Login failed');
    } else {
      const session = await getSession();

      if (session?.user?.role) {
         router.push('/profile');
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen dark-bg p-4 bg-gray-50">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md">
        <div className="content-bg border rounded-2xl shadow-lg overflow-hidden">
          <div className="text-center py-6 px-4">
            <Image
              src="/logo-light.png"
              alt="App Logo"
              width={80}
              height={80}
              className="mx-auto mb-2"
            />
            <h2 className="text-xl font-semibold">Login</h2>
            <p className="text-sm text-light">Dobrodošli, molimo da se logirate</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="user@example.com"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                {...register('email', {
                  required: 'Email je obavezan',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Unesite validan email',
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                {...register('password', {
                  required: 'Password je obavezan',
                })}
              />
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white rounded-full py-2 mt-2 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin mr-2 h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                'Login'
              )}
            </button>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 text-sm px-4 py-2 rounded-md">
                {error}
              </div>
            )}

            <div className="text-center text-sm text-light mt-4">
              Nemate račun?
              <a href="/register" className="ml-1 text-blue-600 hover:underline">
                Registracija
              </a>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
