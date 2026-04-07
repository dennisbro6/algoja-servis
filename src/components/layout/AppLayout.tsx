import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import type { Profile } from '@/types'

interface AppLayoutProps {
  profile: Profile | null
}

export default function AppLayout({ profile }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
