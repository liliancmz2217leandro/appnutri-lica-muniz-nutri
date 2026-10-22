import React, { useEffect, useState } from 'react'
import { Users, Calendar, AlertTriangle, ArrowRight, RefreshCw, UserCheck, Clock } from 'lucide-react'
import { sql, type UserSession } from '../lib/neon'

interface DashboardViewProps {
  user: UserSession
  onSelectPatient: (patientId: string) => void
}

interface PatientWithoutReturn {
  id: string
  nome: string
  telefone?: string
  email?: string
  ultima_consulta: string
  dias_passados: number
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onSelectPatient }) => {
  const [totalPacientes, setTotalPacientes] = useState<number | null>(null)
  const [consultasSemana, setConsultasSemana] = useState<number | null>(null)
  const [pacientesSemRetorno, setPacientesSemRetorno] = useState<PatientWithoutReturn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Total de pacientes cadastrados pela nutricionista logada
      const totalPacientesRes = await sql`
        SELECT COUNT(*)::int as total 
        FROM pacientes 
        WHERE nutricionista_id = ${user.id}
      `
      setTotalPacientes(totalPacientesRes[0]?.total ?? 0)

      // 2. Consultas da semana atual (segunda a domingo da semana corrente)
      const consultasSemanaRes = await sql`
        SELECT COUNT(*)::int as total 
        FROM consultas c
        JOIN pacientes p ON p.id = c.paciente_id
        WHERE p.nutricionista_id = ${user.id}
          AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
          AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + interval '6 days')::date
      `
      setConsultasSemana(consultasSemanaRes[0]?.total ?? 0)

      // 3. Pacientes sem retorno:
      // Cuja última consulta foi há mais de 30 dias E que não possuem próximo retorno agendado (proximo_retorno IS NULL ou no passado)
      const semRetornoRes = await sql`
        WITH ultimas_consultas AS (
          SELECT 
            c.paciente_id,
            MAX(c.data_consulta) as ultima_data,
            MAX(c.proximo_retorno) as max_proximo_retorno
          FROM consultas c
          JOIN pacientes p ON p.id = c.paciente_id
          WHERE p.nutricionista_id = ${user.id}
          GROUP BY c.paciente_id
        )
        SELECT 
          p.id,
          p.nome,
          p.telefone,
          p.email,
          to_char(uc.ultima_data, 'DD/MM/YYYY') as ultima_consulta,
          (CURRENT_DATE - uc.ultima_data)::int as dias_passados
        FROM pacientes p
        JOIN ultimas_consultas uc ON uc.paciente_id = p.id
        WHERE p.nutricionista_id = ${user.id}
          AND uc.ultima_data < (CURRENT_DATE - interval '30 days')
          AND (uc.max_proximo_retorno IS NULL OR uc.max_proximo_retorno < CURRENT_DATE)
        ORDER BY uc.ultima_data ASC
      `

      setPacientesSemRetorno(
        semRetornoRes.map((r: any) => ({
          id: r.id,
          nome: r.nome,
          telefone: r.telefone,
          email: r.email,
          ultima_consulta: r.ultima_consulta,
          dias_passados: Number(r.dias_passados),
        }))
      )
    } catch (err: any) {
      console.error('Erro ao carregar dados do Neon:', err)
      setError('Não foi possível carregar as informações em tempo real do banco Neon.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [user.id])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header com boas vindas e botão de refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Painel da Nutricionista
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Visão geral dos seus atendimentos e acompanhamentos em tempo real no Neon.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar dados</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid com os 3 Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 — Total de pacientes ativos */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-emerald-600/5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total de Pacientes
            </span>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-extrabold text-slate-800">
              {loading ? (
                <div className="h-10 w-20 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                totalPacientes ?? 0
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Pacientes ativos sob seu cuidado
            </p>
          </div>
        </div>

        {/* Card 2 — Consultas da semana */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-teal-600/5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Consultas da Semana
            </span>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-extrabold text-slate-800">
              {loading ? (
                <div className="h-10 w-20 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                consultasSemana ?? 0
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              Registradas na semana atual
            </p>
          </div>
        </div>

        {/* Card 3 — Pacientes sem retorno */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-amber-600/5 transition-all md:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pacientes Sem Retorno
              </span>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-4xl font-extrabold text-slate-800">
                {loading ? (
                  <div className="h-10 w-20 bg-slate-100 rounded-lg animate-pulse" />
                ) : (
                  pacientesSemRetorno.length
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Sem consulta há mais de 30 dias e sem agendamento
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista detalhada do Card 3: Pacientes sem retorno */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Acompanhamento de Pacientes sem Retorno
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pacientes cuja última consulta ocorreu há mais de 30 dias e não possuem retorno marcado.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : pacientesSemRetorno.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <p className="font-medium text-slate-600">Nenhum paciente sem retorno no momento</p>
            <p className="text-xs text-slate-400 mt-1">Todos os seus pacientes estão em dia ou possuem retornos agendados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pacientesSemRetorno.map((paciente) => (
              <div
                key={paciente.id}
                onClick={() => onSelectPatient(paciente.id)}
                className="py-4 px-3 -mx-3 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-sm group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    {paciente.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {paciente.nome}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Última consulta: <span className="font-semibold text-slate-600">{paciente.ultima_consulta}</span> ({paciente.dias_passados} dias atrás)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                    Retorno pendente
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-slate-500 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
