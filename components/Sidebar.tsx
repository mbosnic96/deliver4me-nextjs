'use client'

import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Truck,
  UserCog,
  Settings,
  User,
} from 'lucide-react'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  role: 'client' | 'driver' | 'admin' | undefined
  navbarHeight?: number
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const Sidebar = ({ role, navbarHeight = 0, collapsed, setCollapsed }: SidebarProps) => {
  const pathname = usePathname()
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
      className={`flex items-center gap-3 p-3 rounded-lg transition ${
        pathname.startsWith(href)
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  )

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 z-20 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{ top: navbarHeight }}
    >
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 transition"
        aria-label={collapsed ? 'Prikaži' : 'Sakrij'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Moji linkovi
            </h1>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-2">
          
            <li>
              {role === 'client' && (
                <SidebarLink href="/client" icon={<Home size={18} />} label="Dashboard" />
              )}
              {role === 'driver' && (
                <SidebarLink href="/driver" icon={<Home size={18} />} label="Dashboard" />
              )}
              {role === 'admin' && (
                <SidebarLink href="/admin" icon={<Home size={18} />} label="Dashboard" />
              )}
            </li>

        
            {role === 'driver' && (
              <>
                <li>
                  <SidebarLink href="/vehicles" icon={<Truck size={18} />} label="Moja vozila" />
                </li>
                <li>
                  <SidebarLink href="/driver/my-loads" icon={<Truck size={18} />} label="Moji tereti" />
                </li>
              </>
            )}

         
            {role === 'client' && (
              <li>
                <SidebarLink href="/client/my-loads" icon={<Truck size={18} />} label="Moji tereti" />
              </li>
            )}

           
            {role === 'admin' && (
              <>
                <li>
                  <SidebarLink href="/vehicle-types" icon={<UserCog size={18} />} label="Tipovi vozila" />
                </li>
                <li>
                  <SidebarLink href="/users" icon={<UserCog size={18} />} label="Korisnici" />
                </li>
                  <li>
                  <SidebarLink href="/vehicles" icon={<Truck size={18} />} label="Moja vozila" />
                </li>

                
              <li>
                <SidebarLink href="my-loads" icon={<Truck size={18} />} label="Svi tereti" />
              </li>
              </>
            )}

           
            <li>
              <SidebarLink 
                href="profile" 
                icon={<Settings size={18} />} 
                label="Profil" 
              />
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default Sidebar