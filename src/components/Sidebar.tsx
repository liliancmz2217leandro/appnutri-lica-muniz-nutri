import React from 'react'
import { LayoutDashboard, Users, LogOut, Salad } from 'lucide-react'
import type { UserSession } from '../lib/neon'

interface SidebarProps {
  currentTab: 'dashboard' | 'pacientes'
  onSelectTab: (tab: 'dashboard' | 'pacientes') => void
  user: UserSession
  onLogout: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
}) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      {/* Top Section */}
      <div>
        {/* Logo "Nutri APP" */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Salad className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-800">
              Nutri <span className="text-emerald-600">APP</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Gestão Clínica</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <button
            id="nav-dashboard"
            onClick={() => onSelectTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${currentTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-pacientes"
            onClick={() => onSelectTab('pacientes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'pacientes'
                ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users className={`w-5 h-5 ${currentTab === 'pacientes' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Pacientes</span>
          </button>
        </nav>
      </div>

      {/* User info & Logout */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 mb-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600/10 text-emerald-700 font-bold flex items-center justify-center text-xs">
            {user.name ? user.name.slice(0, 2).toUpperCase() : 'NU'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          </div>
        </div>

        <button
          id="btn-logout"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  )
}
