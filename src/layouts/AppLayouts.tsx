import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import ToastContainer from '../components/ui/ToastContainer'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#0A0706]">
      <ToastContainer />
      <Outlet />
    </div>
  )
}

export function MemberLayout() {
  const { user, signOut } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: '◉' },
    { path: '/app/programacao', label: 'Programação', icon: '◷' },
    { path: '/app/materiais', label: 'Materiais', icon: '◫' },
    { path: '/app/certificados', label: 'Certificados', icon: '◬' },
    { path: '/app/perfil', label: 'Perfil', icon: '◷' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-[#0A0706] flex">
      <aside className="hidden md:flex flex-col w-64 bg-[#0A0706] border-r border-stone-800/50 fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-stone-800/50">
          <Link to="/app/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center text-[#0A0706] font-black text-sm">
              E
            </div>
            <span className="font-bold text-[#F5E6C4]">Envolve</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-[#16120F] text-[#D4AF37]'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-[#16120F]/50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-800/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-sm font-bold">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-200 truncate">{user?.full_name}</p>
              <p className="text-xs text-stone-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full text-left text-sm text-stone-500 hover:text-red-400 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      <button
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-[#16120F] rounded-xl border border-stone-700"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5 text-stone-300" /> : <Menu className="w-5 h-5 text-stone-300" />}
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-y-0 left-0 w-64 bg-[#0A0706] border-r border-stone-800/50 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6">
              <Link to="/app/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center text-[#0A0706] font-black text-sm">E</div>
                <span className="font-bold text-[#F5E6C4]">Envolve</span>
              </Link>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-[#16120F] text-[#D4AF37]'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        <ToastContainer />
        <Outlet />
      </main>
    </div>
  )
}

export function AdminLayout() {
  const { user, signOut } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '◉' },
    { path: '/admin/participantes', label: 'Participantes', icon: '◷' },
    { path: '/admin/crm', label: 'CRM', icon: '◫' },
    { path: '/admin/upload', label: 'Uploads', icon: '◬' },
    { path: '/admin/exportar', label: 'Exportar', icon: '◷' },
    { path: '/admin/auditoria', label: 'Auditoria', icon: '◉' },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-[#0A0706] flex">
      <aside className="hidden md:flex flex-col w-64 bg-[#0A0706] border-r border-stone-800/50 fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-stone-800/50">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center text-[#0A0706] font-black text-sm">
              E
            </div>
            <div>
              <span className="font-bold text-[#F5E6C4]">Envolve</span>
              <span className="block text-[10px] text-stone-500 uppercase tracking-wider">Admin</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-[#16120F] text-[#D4AF37]'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-[#16120F]/50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-800/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-sm font-bold">
              {user?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-200 truncate">{user?.full_name}</p>
              <p className="text-xs text-stone-500 truncate">{user?.role}</p>
            </div>
          </div>
          <Link to="/" className="block text-sm text-stone-500 hover:text-stone-300 mb-2">
            Ver site
          </Link>
          <button
            onClick={signOut}
            className="w-full text-left text-sm text-stone-500 hover:text-red-400 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      <button
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-[#16120F] rounded-xl border border-stone-700"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5 text-stone-300" /> : <Menu className="w-5 h-5 text-stone-300" />}
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-y-0 left-0 w-64 bg-[#0A0706] border-r border-stone-800/50 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6">
              <Link to="/admin" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center text-[#0A0706] font-black text-sm">E</div>
                <span className="font-bold text-[#F5E6C4]">Admin</span>
              </Link>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-[#16120F] text-[#D4AF37]'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
