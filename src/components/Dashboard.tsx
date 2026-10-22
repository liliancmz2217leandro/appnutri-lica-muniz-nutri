import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { DashboardView } from './DashboardView'
import { PacientesView } from './PacientesView'
import type { UserSession } from '../lib/neon'

interface DashboardProps {
  user: UserSession
  onLogout: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'pacientes'>('dashboard')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const handleSelectPatientFromCard = (patientId: string) => {
    setSelectedPatientId(patientId)
    setCurrentTab('pacientes')
  }

  const handleClearSelectedPatient = () => {
    setSelectedPatientId(null)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-row">
      {/* Menu lateral fixo */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab)
          if (tab === 'dashboard') {
            setSelectedPatientId(null)
          }
        }}
        user={user}
        onLogout={onLogout}
      />

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto overflow-y-auto min-h-screen">
        {currentTab === 'dashboard' ? (
          <DashboardView
            user={user}
            onSelectPatient={handleSelectPatientFromCard}
          />
        ) : (
          <PacientesView
            user={user}
            selectedPatientId={selectedPatientId}
            onClearSelectedPatient={handleClearSelectedPatient}
          />
        )}
      </main>
    </div>
  )
}
