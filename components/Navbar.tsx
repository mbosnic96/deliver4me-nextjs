'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Truck, Bell, LogOut, Plus, Wallet, UserCog, Settings, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import NotificationsDropdown from './NotificationsDropdown';
import { useState, useRef, useEffect } from 'react';
import { LoadForm } from './LoadForm';
import MessagesIcon from './MessagesIcon';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const role = session?.user?.role as 'client' | 'driver' | 'admin' | undefined;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);



  const getRoleLinks = () => {
    const baseLinks = [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/profile', label: 'Profil', icon: Settings },
    ];

    if (role === 'driver') {
      return [
        ...baseLinks,
        { href: '/vehicles', label: 'Moja vozila', icon: Truck },
        { href: '/my-loads', label: 'Moji tereti', icon: Truck },
        { href: '/my-wallet', label: 'Novčanik', icon: Wallet },
      ];
    }

    if (role === 'client') {
      return [
        ...baseLinks,
        { href: '/my-loads', label: 'Moji tereti', icon: Truck },
        { href: '/my-wallet', label: 'Novčanik', icon: Wallet },
      ];
    }

    if (role === 'admin') {
      return [
        ...baseLinks,
        { href: '/vehicle-types', label: 'Tipovi vozila', icon: UserCog },
        { href: '/users', label: 'Korisnici', icon: UserCog },
        { href: '/my-loads', label: 'Svi tereti', icon: Truck },
        { href: '/reports', label: 'Prijave korisnika', icon: AlertTriangle },
        { href: '/my-wallet', label: 'Novčanik', icon: Wallet },
        {href: '/cms', label: 'CMS', icon: Settings},
      ];
    }

    return baseLinks;
  };

  const roleLinks = getRoleLinks();
  const showCreateButton = role === 'client' || role === 'admin';

  return (
    <>
      <nav className="w-full content-bg border-b border-gray-200 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 hidden md:flex items-center justify-between">
         
          <div className="md:flex items-center gap-4">
             <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-light.png" alt="Logo" width={120} height={80} />
          </Link>

            <Link
              href="/"
              className={`hidden md:flex items-center gap-1 font-medium transition ${
                pathname === '/' ? 'text-indigo-400' : 'text-white hover:text-indigo-400'
              }`}
            >
              <Home size={18} />
              Početna
            </Link>
            {session && (
            <Link
              href="/load"
              className={`hidden md:flex items-center gap-1 font-medium transition ${
                pathname === '/load' ? 'text-indigo-400' : 'text-white hover:text-indigo-400'
              }`}
            >
              <Truck size={18} />
              Tereti
            </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {session?.user && userId && <NotificationsDropdown userId={userId} />}
            {session?.user && userId && <MessagesIcon userId={userId} />}

            {status === 'loading' ? null : !session?.user ? (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-white hover:text-indigo-400">
                  Prijava
                </Link>
                <Link href="/register" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  Registracija
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 relative">
                {showCreateButton && (
                  <button
                    onClick={() => setShowLoadModal(true)}
                    className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    <Plus size={16} />
                    Novi teret
                  </button>
                )}

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-white hover:text-indigo-400 transition"
                  >
                    <User size={18} />
                    <span className="max-w-[120px] truncate">{session.user.name}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      {roleLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Icon size={16} />
                            {item.label}
                          </Link>
                        );
                      })}
                      <button
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                      >
                        <LogOut size={16} />
                        Odjava
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="md:hidden fixed bottom-0 left-0 right-0 content-bg border-t border-gray-200 z-50 shadow-lg">
        <div className={`flex items-center justify-around py-2 ${showCreateButton ? 'px-2' : 'px-4'}`}>
          <Link
            href="/"
            className={`flex flex-col items-center p-2 rounded-lg transition flex-1 max-w-[50px] ${
              pathname === '/' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600'
            }`}
          >
            <Home size={16} />
            <span className="text-[0.65rem] mt-1">Početna</span>
          </Link>
            {session && (
          <Link
            href="/load"
            className={`flex flex-col items-center p-2 rounded-lg transition flex-1 max-w-[50px] ${
              pathname === '/load' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600'
            }`}
          >
            <Truck size={16} />
            <span className="text-[0.65rem] mt-1">Tereti</span>
          </Link>
           )}

  {session && (
          <Link
            href="/my-wallet"
            className={`flex flex-col items-center p-2 rounded-lg transition flex-1 max-w-[50px] ${
              pathname === '/my-wallet' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600'
            }`}
          >
            <Wallet size={16} />
            <span className="text-[0.65rem] mt-1">Novčanik</span>
          </Link>
           )}

          {showCreateButton && (
            <button
              onClick={() => setShowLoadModal(true)}
              className="flex flex-col items-center p-2 rounded-lg transition text-green-600 hover:text-green-700 flex-1 max-w-[50px] -mt-4"
            >
              <div className="bg-white p-3 rounded-full shadow-lg border-2 border-green-600">
                <Plus size={16} />
              </div>
              <span className="text-[0.65rem] mt-1">Novi</span>
            </button>
          )}
          {session ? (
            <>
             {session?.user && userId && (
  <div
    className={`flex flex-col items-center p-2 py-0 rounded-lg transition flex-1 max-w-[50px] ${
      pathname === '/notifications'
        ? 'text-indigo-600 bg-indigo-50'
        : 'text-gray-600 hover:text-indigo-600'
    }`}
  >
    <NotificationsDropdown userId={userId} />
    <span className="text-[0.65rem] -mt-[4px]">Notifikacije</span>
  </div>
)}

{session?.user && userId && (
  <div
    className={`flex flex-col items-center p-2 rounded-lg transition flex-1 max-w-[50px] ${
      pathname === '/messages'
        ? 'text-indigo-600 bg-indigo-50'
        : 'text-gray-600 hover:text-indigo-600'
    }`}
  >
    <MessagesIcon userId={userId} />
    <span className="text-[0.65rem] -mt-[4px]">Poruke</span>
  </div>
)}

              <div className="relative flex-1 max-w-[50px]" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex flex-col items-center p-2 rounded-lg transition w-full ${
                    userMenuOpen ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  <Settings size={16} />
                  <span className="text-[0.65rem] mt-1">Više</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    {roleLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Icon size={16} />
                          {item.label}
                        </Link>
                      );
                    })}
                    <button
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                    >
                      <LogOut size={16} />
                      Odjava
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="flex flex-col items-center p-2 rounded-lg transition text-gray-600 hover:text-indigo-600 flex-1 max-w-[50px]"
            >
              <User size={16} />
              <span className="text-[0.65rem] mt-1">Prijava</span>
            </Link>
          )}
        </div>
      </div>

      {showLoadModal && (
        <LoadForm
          onClose={() => setShowLoadModal(false)}
          onSaved={() => setShowLoadModal(false)}
        />
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 70px;
          }
        }
      `}</style>
    </>
  );
}
