import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useEffect, useRef } from 'react'
import { useAuthStore } from './stores/authStore'
import { PageLoader } from './components/ui/LoadingSpinner'
import PublicLayout, { MemberLayout, AdminLayout } from './layouts/AppLayouts'

import Landing from './pages/public/Landing'
import Login from './pages/auth/Login'
import ResetPassword from './pages/auth/ResetPassword'
import AcceptInvite from './pages/auth/AcceptInvite'
import MemberDashboard from './pages/member/Dashboard'
import MemberSchedule from './pages/member/Schedule'
import MemberMaterials from './pages/member/Materials'
import MemberCertificates from './pages/member/Certificates'
import MemberProfile from './pages/member/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import AdminParticipants from './pages/admin/Participants'
import AdminCRM from './pages/admin/CRM'
import AdminUpload from './pages/admin/Upload'
import AdminExport from './pages/admin/Export'
import AdminAudit from './pages/admin/Audit'

function AuthGuard({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuthStore()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return <>{children}</>
}

function AppContent() {
  const loading = useAuthStore((s) => s.loading)
  const initialize = useAuthStore((s) => s.initialize)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      initialize()
    }
  }, [initialize])

  if (loading) return <PageLoader />

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
      </Route>

      <Route
        element={
          <AuthGuard roles={['participant', 'admin', 'operator']}>
            <MemberLayout />
          </AuthGuard>
        }
      >
        <Route path="/app/dashboard" element={<MemberDashboard />} />
        <Route path="/app/programacao" element={<MemberSchedule />} />
        <Route path="/app/materiais" element={<MemberMaterials />} />
        <Route path="/app/certificados" element={<MemberCertificates />} />
        <Route path="/app/perfil" element={<MemberProfile />} />
      </Route>

      <Route
        element={
          <AuthGuard roles={['admin', 'operator']}>
            <AdminLayout />
          </AuthGuard>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/participantes" element={<AdminParticipants />} />
        <Route path="/admin/crm" element={<AdminCRM />} />
        <Route path="/admin/upload" element={<AdminUpload />} />
        <Route path="/admin/exportar" element={<AdminExport />} />
        <Route path="/admin/auditoria" element={<AdminAudit />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </HelmetProvider>
  )
}
