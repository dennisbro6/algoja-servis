import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import NovNalogPage from '@/pages/NovNalogPage'
import NalogDetailPage from '@/pages/NalogDetailPage'
import StrankePage from '@/pages/StrankePage'
import StrojiPage from '@/pages/StrojiPage'
import ServiserjePage from '@/pages/ServiserjePage'

function ProtectedApp() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Nalagam...</div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <Routes>
      <Route element={<AppLayout profile={profile} />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/nalogi/nov" element={<NovNalogPage />} />
        <Route path="/nalogi/:id" element={<NalogDetailPage />} />
        <Route path="/nalogi/:id/uredi" element={<NovNalogPage />} />
        <Route path="/stranke" element={<StrankePage />} />
        <Route path="/stroji" element={<StrojiPage />} />
        <Route path="/serviserji" element={<ServiserjePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ProtectedApp />
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  )
}
