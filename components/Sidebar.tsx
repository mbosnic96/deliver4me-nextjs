'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Truck,
  UserCog,
  Settings,
  Wallet,
  AlertTriangle
} from 'lucide-react'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  role: 'client' | 'driver' | 'admin' | undefined
  navbarHeight?: number
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const Sidebar = ({ role, navbarHeight = 64, collapsed, setCollapsed }: SidebarProps) => {
  const pathname = usePathname()
  const [calculatedHeight, setCalculatedHeight] = useState('100vh')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setCalculatedHeight(`calc(100vh - ${navbarHeight}px)`)

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) 
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [navbarHeight])

  if (isMobile) return null

  const toggleSidebar = () => setCollapsed(!collapsed)

  const SidebarLink = ({
    href,
    icon,
    label,
  }: {
    href: string
    icon: React.ReactNode
    label: string
  }) => (
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
        pathname.startsWith(href)
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 shadow-sm'
          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
      } ${collapsed ? 'justify-center px-2' : ''}`}
      title={collapsed ? label : ''}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && (
        <span className="whitespace-nowrap transition-opacity duration-200">
          {label}
        </span>
      )}
    </Link>
  )

  return (
    <div
      className={`fixed left-0 top-0 bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 z-30 border-r border-gray-200 dark:border-gray-800 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{
        height: calculatedHeight,
        top: navbarHeight,
      }}
    >
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 transition shadow-lg z-40"
        aria-label={collapsed ? 'Proširi' : 'Skupi'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="h-full flex flex-col">
        {!collapsed && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
              Navigacija
            </h1>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            <SidebarLink href="/dashboard" icon={<Home size={18} />} label="Dashboard" />
            {role === 'driver' && (
              <>
                <SidebarLink href="/vehicles" icon={<Truck size={18} />} label="Moja vozila" />
                <SidebarLink href="/my-loads" icon={<Truck size={18} />} label="Moji tereti" />
                <SidebarLink href="/my-wallet" icon={<Wallet size={18} />} label="Novčanik" />
              </>
            )}
            {role === 'client' && (
              <>
                <SidebarLink href="/my-loads" icon={<Truck size={18} />} label="Moji tereti" />
                <SidebarLink href="/my-wallet" icon={<Wallet size={18} />} label="Novčanik" />
              </>
            )}
            {role === 'admin' && (
              <>
                <SidebarLink href="/vehicle-types" icon={<UserCog size={18} />} label="Tipovi vozila" />
                <SidebarLink href="/users" icon={<UserCog size={18} />} label="Korisnici" />
                <SidebarLink href="/my-loads" icon={<Truck size={18} />} label="Svi tereti" />
                <SidebarLink href="/reports" icon={<AlertTriangle size={18} />} label="Prijave korisnika" />
              </>
            )}
            <SidebarLink href="/profile" icon={<Settings size={18} />} label="Profil" />
          </div>
        </nav>
      </div>
    </div>
  )
}

export default Sidebar
