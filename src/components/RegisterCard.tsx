import React, { useState } from 'react'
import { authClient, setStoredSession, syncNutricionista, type UserSession } from '../lib/neon'
import { User, Mail, Lock, UserPlus, AlertCircle, ArrowLeft, Salad, CheckCircle2 } from 'lucide-react'

interface RegisterCardProps {
  onSuccess: (user: UserSession) => void
  onNavigateToLogin: () => void
}

export const RegisterCard: React.FC<RegisterCardProps> = ({ onSuccess, onNavigateToLogin }) => {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nome.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    if (password.length < 9) {
      setError('A senha deve ter no mínimo 9 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Digite com atenção.')
      return
    }

    setLoading(true)
    try {
      // 1. Criar usuário no Neon Auth
      try {
        const res = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: nome.trim(),
        })
        if (res.error) {
          throw new Error(res.error.message || 'Falha ao registrar no Neon Auth.')
        }
      } catch (authErr: any) {
        if (authErr?.message && !authErr.message.includes('fetch')) {
          console.warn('Neon Auth signup notification:', authErr.message)
        }
      }

      // 2. Salvar nome e email do nutricionista na tabela nutricionistas do Neon
      const user = await syncNutricionista(nome.trim(), email.trim())

      // 3. Manter sessão ativa salva localmente
      setStoredSession(user)
      onSuccess(user)
    } catch (err: any) {
      console.error('Erro no cadastro:', err)
      setError(err?.message || 'Ocorreu um erro ao criar a conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header / Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 mb-4 transition-transform hover:scale-105 duration-300">
          <Salad className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Nutri<span className="text-emerald-600">System</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Crie sua conta profissional de nutricionista
        </p>
      </div>

      {/* Card Form */}
      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Criar nova conta</h2>
          <p className="text-xs text-slate-400 mt-0.5">Cadastre-se para começar a atender seus pacientes.</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nome completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="register-name"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Dra. Mariana Silva"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              E-mail profissional
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nutricionista@clinica.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Senha
              </label>
              <span className="text-[11px] text-slate-400">Mínimo 9 caracteres</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 9 caracteres"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirmar senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua senha"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <button
            id="register-submit"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Criar conta</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Já tem conta?{' '}
            <button
              id="link-go-to-login"
              type="button"
              onClick={onNavigateToLogin}
              className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              Faça login
            </button>
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 text-[12px] text-slate-500">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tabela `nutricionistas`
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dados Criptografados
        </span>
      </div>
    </div>
  )
}
