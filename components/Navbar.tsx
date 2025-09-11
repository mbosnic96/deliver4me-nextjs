'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, LogIn, UserPlus, Home, User } from 'lucide-react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import NotificationsDropdown from './NotificationsDropdown';

const navLinks = [
  { href: '/', label: 'Početna', icon: <Home size={18} /> },
  { href: '/login', label: 'Prijava', icon: <LogIn size={18} /> },
  { href: '/register', label: 'Registracija', icon: <UserPlus size={18} />, cta: true },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userId = session?.user?.id;

  return (
    <nav className="w-full content-bg border-b border-gray-200 shadow-md relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-light.png" alt="Logo" width={120} height={80} />
          </Link>
          <Link
            href="/"
            className="hidden md:flex text-white hover:text-indigo-400 font-medium items-center gap-1"
          >
            <Home size={18} />
            Početna
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6 relative">
          {session?.user && userId && (
            <NotificationsDropdown userId={userId} />
          )}

          {status === 'loading' ? null : !session?.user ? (
            <>
              {navLinks.slice(1).map(({ href, label, icon, cta }) => (
                <Link
                  key={label}
                  href={href}
                  className={
                    cta
                      ? 'flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition'
                      : 'text-white hover:text-indigo-400 flex items-center gap-1'
                  }
                >
                  {icon}
                  {label}
                </Link>
              ))}
            </>
          ) : (
            <>
           
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-white hover:text-indigo-400 transition"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <User size={18} />
                <span>{session.user.name}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-10 w-40 bg-white rounded-md shadow-lg py-2 z-50 text-gray-800">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 hover:bg-indigo-100 transition"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Profil
                  </Link>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-indigo-100 transition"
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                  >
                    Odjava
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-indigo-400 hover:text-indigo-600"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

  
      {isOpen && (
        <div className="md:hidden px-4 pb-4 content-bg border-t border-gray-200 space-y-2">
          {session?.user && userId && (
            <NotificationsDropdown userId={userId} />
          )}

          {status === 'loading' ? null : !session?.user ? (
            navLinks.map(({ href, label, icon, cta }) => (
              <Link
                key={label}
                href={href}
                className={`block py-2 ${
                  cta
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 justify-center'
                    : 'text-white hover:text-indigo-400 flex items-center gap-2'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {icon}
                {label}
              </Link>
            ))
          ) : (
            <>
              <Link
                href="/profile"
                className="block py-2 text-white hover:text-indigo-400 flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <User size={18} />
                Profil
              </Link>
              <button
                className="w-full text-left py-2 text-white hover:text-indigo-400 flex items-center gap-2"
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
              >
                Odjava
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
