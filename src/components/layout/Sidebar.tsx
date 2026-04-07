import { NavLink } from 'react-router-dom'
import { ClipboardList, Users, Cog, HardDrive, UserCog, Wrench, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/hooks/useAuth'
import type { Profile } from '@/types'

interface SidebarProps {
  profile: Profile | null
}

const navItems = [
  { to: '/', icon: ClipboardList, label: 'Nalogi', end: true },
  { to: '/stranke', icon: Users, label: 'Stranke' },
  { to: '/stroji', icon: Cog, label: 'Stroji' },
  { to: '/serviserji', icon: UserCog, label: 'Serviserji' },
]

export default function Sidebar({ profile }: SidebarProps) {
  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm">Algoja Servis</div>
            <div className="text-xs text-gray-400">Folija stroji</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-800">
        {profile && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
              {profile.ime[0]}{profile.priimek[0]}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{profile.ime} {profile.priimek}</div>
              <div className="text-xs text-gray-400 truncate">{profile.vloga}</div>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Odjava
        </button>
        {profile && (
          <div className="px-3 mt-2">
            <NavLink
              to="/nastavitve"
              className="flex items-center gap-3 py-2 rounded-md text-sm text-gray-400 hover:text-white transition-colors"
            >
              <HardDrive className="h-4 w-4" />
              Nastavitve
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  )
}
