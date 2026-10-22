import React, { useEffect, useState } from 'react'
import {
  Users,
  Search,
  Plus,
  Calendar,
  Target,
  ArrowRight,
} from 'lucide-react'
import { sql, type UserSession } from '../lib/neon'
import { type Paciente } from './patientUtils'
import { NovoPacienteForm } from './NovoPacienteForm'
import { PacientePerfil } from './PacientePerfil'

interface PacientesViewProps {
  user: UserSession
  selectedPatientId?: string | null
  onClearSelectedPatient?: () => void
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  user,
  selectedPatientId: initialSelectedId,
  onClearSelectedPatient,
}) => {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null)
  const [viewMode, setViewMode] = useState<'lista' | 'novo' | 'perfil'>('lista')
  const [justCreated, setJustCreated] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const loadPacientes = async (selectIdAfterLoad?: string) => {
    try {
      setLoading(true)
      const data = await sql`
        SELECT 
          p.id,
          p.nutricionista_id,
          p.nome,
          p.data_nascimento,
          p.sexo,
          p.telefone,
          p.whatsapp,
          p.email,
          p.peso_inicial,
          p.altura,
          p.objetivos,
          p.objetivo_texto,
          p.nivel_atividade,
          p.patologias,
          p.restricoes_alimentares,
          p.alergias,
          p.medicamentos,
          p.suplementos,
          p.refeicoes_por_dia,
          p.horario_acorda,
          p.horario_dorme,
          p.litros_agua,
          p.atividade_fisica,
          p.atividade_fisica_descricao,
          p.observacoes,
          p.created_at,
          to_char(MAX(c.data_consulta), 'DD/MM/YYYY') as ultima_consulta
        FROM pacientes p
        LEFT JOIN consultas c ON c.paciente_id = p.id
        WHERE p.nutricionista_id = ${user.id}
        GROUP BY p.id
        ORDER BY p.nome ASC
      `
      const list = data as Paciente[]
      setPacientes(list)

      const targetId = selectIdAfterLoad || initialSelectedId
      if (targetId) {
        const found = list.find((p) => p.id === targetId)
        if (found) {
          setSelectedPatient(found)
          setViewMode('perfil')
        }
      }
    } catch (err) {
      console.error('Erro ao carregar pacientes do Neon:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPacientes(initialSelectedId || undefined)
  }, [user.id, initialSelectedId])

  // Busca por nome
  const filteredPacientes = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase().trim())
  )

  // Ao clicar em um paciente da lista
  const handleSelectPatient = (paciente: Paciente) => {
    setSelectedPatient(paciente)
    setJustCreated(false)
    setViewMode('perfil')
  }

  // Ao voltar para a lista
  const handleBackToList = () => {
    setSelectedPatient(null)
    setJustCreated(false)
    setViewMode('lista')
    if (onClearSelectedPatient) onClearSelectedPatient()
    loadPacientes()
  }

  // Ao concluir o cadastro com sucesso
  const handlePatientCreated = (novoPaciente: Paciente) => {
    setJustCreated(true)
    setSelectedPatient(novoPaciente)
    setViewMode('perfil')
    loadPacientes()
  }

  // 1. Visualização do Formulário de Cadastro (Página Nova com Menu Lateral Mantido)
  if (viewMode === 'novo') {
    return (
      <NovoPacienteForm
        user={user}
        onCancel={handleBackToList}
        onSuccess={handlePatientCreated}
      />
    )
  }

  // 2. Visualização do Perfil do Paciente (com Menu Lateral Mantido)
  if (viewMode === 'perfil' && selectedPatient) {
    return (
      <PacientePerfil
        paciente={selectedPatient}
        onBack={handleBackToList}
        justCreated={justCreated}
      />
    )
  }

  // 3. Visualização da Lista Geral de Pacientes
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho da Listagem */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Pacientes
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Visualize e gerencie todos os pacientes cadastrados em sua clínica.
          </p>
        </div>

        <button
          id="btn-novo-paciente"
          onClick={() => setViewMode('novo')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Paciente</span>
        </button>
      </div>

      {/* Campo de Busca por Nome */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          id="input-busca-paciente"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar paciente por nome..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs placeholder:text-slate-400 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-3 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer px-2 py-1"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Área de Listagem */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Carregando pacientes do Neon...</p>
        </div>
      ) : pacientes.length === 0 ? (
        /* Se não houver pacientes cadastrados */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">
            Nenhum paciente cadastrado ainda
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 mb-6">
            Comece cadastrando seu primeiro paciente para acompanhar evolução clínica, hábitos e consultas.
          </p>
          <button
            onClick={() => setViewMode('novo')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Paciente</span>
          </button>
        </div>
      ) : filteredPacientes.length === 0 ? (
        /* Busca não encontrou resultados */
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs max-w-md mx-auto my-6">
          <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 text-sm">
            Nenhum resultado encontrado
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Não encontramos nenhum paciente com o nome "{searchTerm}".
          </p>
        </div>
      ) : (
        /* Grid de Pacientes - Cada um exibe: nome, objetivo e data da última consulta */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPacientes.map((p) => {
            // Formata os objetivos para exibição limpa
            let displayObjetivo = 'Sem objetivo informado'
            if (p.objetivos && p.objetivos.length > 0) {
              displayObjetivo = p.objetivos.join(', ')
            } else if (p.objetivo_texto) {
              displayObjetivo = p.objetivo_texto
            }

            return (
              <div
                key={p.id}
                onClick={() => handleSelectPatient(p)}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md shadow-slate-200/40 hover:shadow-xl hover:shadow-emerald-600/10 hover:border-emerald-200 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Topo do Card: Avatar e Nome */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0 shadow-xs">
                      {p.nome ? p.nome.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-800 text-base group-hover:text-emerald-700 transition-colors truncate">
                        {p.nome}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {p.sexo ? `${p.sexo}` : 'Paciente'}
                      </span>
                    </div>
                  </div>

                  {/* Informações Obrigatórias: Objetivo */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        <Target className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Objetivo</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {displayObjetivo}
                      </p>
                    </div>

                    {/* Informações Obrigatórias: Data da Última Consulta */}
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>Última Consulta</span>
                      </div>
                      <p className="text-xs font-medium text-slate-600">
                        {p.ultima_consulta ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md">
                            {p.ultima_consulta}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Nenhuma consulta registrada
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer do Card com CTA sutil */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Ver perfil completo</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
