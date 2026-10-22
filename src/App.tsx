import { useEffect, useState } from 'react'
import { LoginCard } from './components/LoginCard'
import { RegisterCard } from './components/RegisterCard'
import { Dashboard } from './components/Dashboard'
import { getStoredSession, setStoredSession, type UserSession } from './lib/neon'

export function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [view, setView] = useState<'login' | 'register'>('login')
  const [loadingInitial, setLoadingInitial] = useState(true)

  // 1. Manter a sessão ativa para que não precise fazer login toda vez
  // 2. Se já estiver logado e tentar acessar a tela de login, redirecionar direto para o dashboard
  useEffect(() => {
    const session = getStoredSession()
    if (session) {
      setCurrentUser(session)
    }
    setLoadingInitial(false)
  }, [])

  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    setStoredSession(null)
    setCurrentUser(null)
    setView('login')
  }

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Se logado -> Exibe o Dashboard
  if (currentUser) {
    return <Dashboard user={currentUser} onLogout={handleLogout} />
  }

  // Se não logado -> Alterna entre Login e Cadastro
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-slate-50 to-emerald-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {view === 'login' ? (
        <LoginCard
          onSuccess={handleLoginSuccess}
          onNavigateToRegister={() => setView('register')}
        />
      ) : (
        <RegisterCard
          onSuccess={handleLoginSuccess}
          onNavigateToLogin={() => setView('login')}
        />
      )}
    </div>
  )
}

export default App
