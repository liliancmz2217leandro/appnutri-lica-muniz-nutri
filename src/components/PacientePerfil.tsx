import React, { useEffect, useState } from 'react'
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  Scale,
  Ruler,
  Droplets,
  Clock,
  Sparkles,
  Activity,
  CheckCircle2,
  Plus,
  Utensils,
  Save,
  ChevronRight,
  FileText,
  X,
  TrendingUp,
} from 'lucide-react'
import { sql } from '../lib/neon'
import {
  calculateAge,
  calculateIMC,
  formatPhone,
  parseTimeToHHMM,
  OPCOES_OBJETIVOS,
  OPCOES_ATIVIDADE_FISICA,
  OPCOES_PATOLOGIAS,
  OPCOES_RESTRICOES,
  OPCOES_ALERGIAS,
  type Paciente,
  type Consulta,
  type PlanoAlimentar,
} from './patientUtils'
import { EvolucaoPesoChart } from './EvolucaoPesoChart'
import { NovaConsultaModal } from './NovaConsultaModal'

interface PacientePerfilProps {
  paciente: Paciente
  onBack: () => void
  justCreated?: boolean
}

export const PacientePerfil: React.FC<PacientePerfilProps> = ({
  paciente: initialPaciente,
  onBack,
  justCreated = false,
}) => {
  // Estado do Paciente (atualizável ao salvar alterações)
  const [paciente, setPaciente] = useState<Paciente>(initialPaciente)

  // 3 Seções Principais (Prompt 5)
  const [activeSection, setActiveSection] = useState<'dados' | 'consultas' | 'planos'>('consultas')

  // Sub-abas da Seção 1 (Dados do Paciente)
  const [dadosSubTab, setDadosSubTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal')

  // Consultas e Modal de Nova Consulta
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loadingConsultas, setLoadingConsultas] = useState(true)
  const [showNovaConsultaModal, setShowNovaConsultaModal] = useState(false)

  // Planos Alimentares
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null)
  const [showPlanPromptNotice, setShowPlanPromptNotice] = useState(false)

  // Feedback e Notificações
  const [savingDados, setSavingDados] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    justCreated ? 'Paciente cadastrado com sucesso no banco de dados!' : null
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // --- Campos Editáveis da Seção 1 (Dados do Paciente) ---
  const [nome, setNome] = useState(initialPaciente.nome || '')
  const [dataNascimento, setDataNascimento] = useState(initialPaciente.data_nascimento || '')
  const [sexo, setSexo] = useState(initialPaciente.sexo || '')
  const [telefone, setTelefone] = useState(initialPaciente.telefone || '')
  const [whatsapp, setWhatsapp] = useState(initialPaciente.whatsapp || '')
  const [email, setEmail] = useState(initialPaciente.email || '')

  // Clínico
  const [pesoKg, setPesoKg] = useState<string>(
    initialPaciente.peso_inicial ? String(initialPaciente.peso_inicial) : ''
  )
  const [alturaCm, setAlturaCm] = useState<string>(() => {
    if (!initialPaciente.altura) return ''
    return initialPaciente.altura < 3
      ? String(Math.round(initialPaciente.altura * 100))
      : String(Math.round(initialPaciente.altura))
  })
  const [objetivos, setObjetivos] = useState<string[]>(initialPaciente.objetivos || [])
  const [objetivoTexto, setObjetivoTexto] = useState(initialPaciente.objetivo_texto || '')
  const [nivelAtividade, setNivelAtividade] = useState(initialPaciente.nivel_atividade || '')
  const [patologias, setPatologias] = useState<string[]>(initialPaciente.patologias || [])
  const [novaPatologia, setNovaPatologia] = useState('')
  const [restricoes, setRestricoes] = useState<string[]>(initialPaciente.restricoes_alimentares || [])
  const [novaRestricao, setNovaRestricao] = useState('')
  const [alergias, setAlergias] = useState<string[]>(initialPaciente.alergias || [])
  const [novaAlergia, setNovaAlergia] = useState('')
  const [medicamentos, setMedicamentos] = useState(initialPaciente.medicamentos || '')
  const [suplementos, setSuplementos] = useState(initialPaciente.suplementos || '')

  // Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState<string>(
    initialPaciente.refeicoes_por_dia ? String(initialPaciente.refeicoes_por_dia) : ''
  )
  const [horarioAcorda, setHorarioAcorda] = useState(initialPaciente.horario_acorda || '')
  const [horarioDorme, setHorarioDorme] = useState(initialPaciente.horario_dorme || '')
  const [litrosAgua, setLitrosAgua] = useState<string>(
    initialPaciente.litros_agua ? String(initialPaciente.litros_agua) : ''
  )
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState<boolean | null>(
    initialPaciente.atividade_fisica ?? null
  )
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState(
    initialPaciente.atividade_fisica_descricao || ''
  )
  const [observacoes, setObservacoes] = useState(initialPaciente.observacoes || '')

  // Cálculos dinâmicos
  const idade = calculateAge(dataNascimento)
  const imcInfo = calculateIMC(
    pesoKg ? parseFloat(pesoKg) : null,
    alturaCm ? parseFloat(alturaCm) : null
  )

  // 1. Carregar Consultas em tempo real do Neon
  const loadConsultas = async () => {
    try {
      setLoadingConsultas(true)
      const data = await sql`
        SELECT 
          id, 
          paciente_id,
          to_char(data_consulta, 'DD/MM/YYYY') as data_consulta,
          peso, 
          cintura, 
          quadril, 
          percentual_gordura,
          to_char(proximo_retorno, 'DD/MM/YYYY') as proximo_retorno,
          observacoes,
          created_at
        FROM consultas
        WHERE paciente_id = ${paciente.id}
        ORDER BY data_consulta DESC, created_at DESC
      `
      setConsultas(data as Consulta[])
    } catch (err) {
      console.error('Erro ao carregar consultas do Neon:', err)
      setConsultas([])
    } finally {
      setLoadingConsultas(false)
    }
  }

  // 2. Carregar Planos Alimentares em tempo real do Neon
  const loadPlanos = async () => {
    try {
      setLoadingPlanos(true)
      const data = await sql`
        SELECT 
          id,
          paciente_id,
          conteudo,
          to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_geracao,
          created_at
        FROM planos_alimentares
        WHERE paciente_id = ${paciente.id}
        ORDER BY created_at DESC
      `
      setPlanos(data as PlanoAlimentar[])
    } catch (err) {
      console.error('Erro ao carregar planos alimentares do Neon:', err)
      setPlanos([])
    } finally {
      setLoadingPlanos(false)
    }
  }

  useEffect(() => {
    loadConsultas()
    loadPlanos()
  }, [paciente.id])

  // Manipuladores de Tags
  const toggleMultiSelectWithNone = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (item === 'Nenhum') {
      if (currentList.includes('Nenhum')) {
        setList([])
      } else {
        setList(['Nenhum'])
      }
      return
    }
    const withoutNone = currentList.filter((i) => i !== 'Nenhum')
    if (withoutNone.includes(item)) {
      setList(withoutNone.filter((i) => i !== item))
    } else {
      setList([...withoutNone, item])
    }
  }

  const addCustomTag = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    tagText: string,
    clearInput: () => void
  ) => {
    const trimmed = tagText.trim()
    if (!trimmed) return
    const withoutNone = currentList.filter((i) => i !== 'Nenhum')
    if (!withoutNone.includes(trimmed)) {
      setList([...withoutNone, trimmed])
    }
    clearInput()
  }

  const removeTag = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    tagToRemove: string
  ) => {
    setList(currentList.filter((i) => i !== tagToRemove))
  }

  const toggleObjetivo = (item: string) => {
    if (objetivos.includes(item)) {
      setObjetivos(objetivos.filter((o) => o !== item))
    } else {
      setObjetivos([...objetivos, item])
    }
  }

  // Salvar Alterações na Seção 1 (Dados do Paciente)
  const handleSaveDados = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!nome.trim()) {
      setErrorMessage('O nome do paciente é obrigatório.')
      return
    }

    try {
      setSavingDados(true)
      const alturaParaBanco = alturaCm ? Number((parseFloat(alturaCm) / 100).toFixed(2)) : null
      const pesoParaBanco = pesoKg ? parseFloat(pesoKg) : null
      const aguaParaBanco = litrosAgua ? parseFloat(litrosAgua) : null
      const refeicoesParaBanco = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null

      const res = await sql`
        UPDATE pacientes
        SET
          nome = ${nome.trim()},
          data_nascimento = ${dataNascimento || null},
          sexo = ${sexo || null},
          telefone = ${telefone.trim() || null},
          whatsapp = ${whatsapp.trim() || null},
          email = ${email.trim() || null},
          peso_inicial = ${pesoParaBanco},
          altura = ${alturaParaBanco},
          objetivos = ${objetivos.length > 0 ? objetivos : null},
          objetivo_texto = ${objetivoTexto.trim() || null},
          nivel_atividade = ${nivelAtividade || null},
          patologias = ${patologias.length > 0 ? patologias : null},
          restricoes_alimentares = ${restricoes.length > 0 ? restricoes : null},
          alergias = ${alergias.length > 0 ? alergias : null},
          medicamentos = ${medicamentos.trim() || null},
          suplementos = ${suplementos.trim() || null},
          refeicoes_por_dia = ${refeicoesParaBanco},
          horario_acorda = ${horarioAcorda.trim() || null},
          horario_dorme = ${horarioDorme.trim() || null},
          litros_agua = ${aguaParaBanco},
          atividade_fisica = ${praticaAtividadeFisica},
          atividade_fisica_descricao = ${
            praticaAtividadeFisica ? (atividadeFisicaDescricao.trim() || null) : null
          },
          observacoes = ${observacoes.trim() || null}
        WHERE id = ${paciente.id}
        RETURNING *
      `

      if (res && res[0]) {
        setPaciente(res[0] as Paciente)
        setSuccessMessage('Alterações salvas com sucesso no banco de dados!')
        setTimeout(() => setSuccessMessage(null), 5000)
      }
    } catch (err: any) {
      console.error('Erro ao atualizar paciente no Neon:', err)
      setErrorMessage('Ocorreu um erro ao salvar as alterações no banco.')
    } finally {
      setSavingDados(false)
    }
  }

  // Ao cadastrar nova consulta com sucesso
  const handleConsultaSuccess = (novaConsulta: Consulta) => {
    setConsultas((prev) => [novaConsulta, ...prev])
    setSuccessMessage('Nova consulta registrada com sucesso!')
    setTimeout(() => setSuccessMessage(null), 5000)
    loadConsultas()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast / Mensagens de Sucesso e Erro */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-semibold text-xs sm:text-sm">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1 rounded-lg cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <X className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="font-semibold text-xs sm:text-sm">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-semibold px-2 py-1 rounded-lg cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Header Superior com Botão Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para lista de pacientes</span>
        </button>

        {activeSection === 'dados' && (
          <button
            type="button"
            onClick={handleSaveDados}
            disabled={savingDados}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>{savingDados ? 'Salvando alterações...' : 'Salvar alterações'}</span>
          </button>
        )}

        {activeSection === 'consultas' && (
          <button
            type="button"
            onClick={() => setShowNovaConsultaModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Consulta</span>
          </button>
        )}
      </div>

      {/* Header do Perfil do Paciente */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-md shadow-slate-200/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
              {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                  {paciente.nome}
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                  Paciente Ativo
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 mt-1.5">
                {idade !== null && (
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {idade} anos {paciente.sexo ? `• ${paciente.sexo}` : ''}
                  </span>
                )}
                {paciente.telefone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {paciente.telefone}
                  </span>
                )}
                {paciente.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {paciente.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="px-3.5 py-2 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Peso Inicial
              </span>
              <span className="text-sm font-extrabold text-slate-800">
                {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '--'}
              </span>
            </div>
            <div className="px-3.5 py-2 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Consultas
              </span>
              <span className="text-sm font-extrabold text-emerald-700">
                {consultas.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação entre as 3 Seções Principais (Prompt 5) */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex flex-row gap-1">
        <button
          type="button"
          onClick={() => setActiveSection('dados')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSection === 'dados'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Dados do Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('consultas')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSection === 'consultas'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>2. Consultas</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
            activeSection === 'consultas'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {consultas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('planos')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSection === 'planos'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>3. Planos Alimentares</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
            activeSection === 'planos'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {planos.length}
          </span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* SEÇÃO 1 — DADOS DO PACIENTE (EDITÁVEIS DIRETAMENTE) */}
      {/* =================================================================== */}
      {activeSection === 'dados' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Sub-abas: Pessoal, Clínico e Hábitos */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              type="button"
              onClick={() => setDadosSubTab('pessoal')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer flex items-center gap-2 ${
                dadosSubTab === 'pessoal'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Pessoal</span>
            </button>

            <button
              type="button"
              onClick={() => setDadosSubTab('clinico')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer flex items-center gap-2 ${
                dadosSubTab === 'clinico'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Clínico</span>
            </button>

            <button
              type="button"
              onClick={() => setDadosSubTab('habitos')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer flex items-center gap-2 ${
                dadosSubTab === 'habitos'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Hábitos</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md shadow-slate-200/30">
            {/* SUB-ABA 1: PESSOAL */}
            {dadosSubTab === 'pessoal' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Dados Pessoais</h3>
                    <p className="text-xs text-slate-400">Edite os dados cadastrais do paciente</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                    Editável
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Data de Nascimento
                      </label>
                      {idade !== null && (
                        <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                          {idade} {idade === 1 ? 'ano' : 'anos'}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Sexo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Feminino', 'Masculino', 'Outro'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSexo(opt)}
                          className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            sexo === opt
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhone(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-ABA 2: CLÍNICO */}
            {dadosSubTab === 'clinico' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Dados Clínicos</h3>
                    <p className="text-xs text-slate-400">Medidas, histórico clínico, restrições e objetivos</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                    Editável
                  </span>
                </div>

                {/* Antropometria: Peso, Altura e IMC */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-emerald-600" /> Peso Inicial
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={pesoKg}
                        onChange={(e) => setPesoKg(e.target.value)}
                        className="w-full pr-10 pl-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                        kg
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5 text-emerald-600" /> Altura
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={alturaCm}
                        onChange={(e) => setAlturaCm(e.target.value)}
                        className="w-full pr-10 pl-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> IMC Calculado
                    </label>
                    <div className="h-11 px-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      {imcInfo ? (
                        <>
                          <span className="text-base font-extrabold text-slate-800">
                            {imcInfo.valor} <span className="text-[10px] font-normal text-slate-400">kg/m²</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${imcInfo.corBadge}`}>
                            {imcInfo.classificacao}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Preencha peso e altura</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Objetivos (múltipla escolha)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {OPCOES_OBJETIVOS.map((obj) => {
                      const isSelected = objetivos.includes(obj)
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => toggleObjetivo(obj)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {obj}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    type="text"
                    value={objetivoTexto}
                    onChange={(e) => setObjetivoTexto(e.target.value)}
                    placeholder="Observações complementares sobre objetivos..."
                    className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Nível de Atividade Física */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Nível de Atividade Física
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {OPCOES_ATIVIDADE_FISICA.map((nv) => (
                      <button
                        key={nv}
                        type="button"
                        onClick={() => setNivelAtividade(nv)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                          nivelAtividade === nv
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {nv}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patologias */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Patologias ou Condições de Saúde
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => toggleMultiSelectWithNone(patologias, setPatologias, 'Nenhum')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        patologias.includes('Nenhum')
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Nenhum
                    </button>
                    {OPCOES_PATOLOGIAS.map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => toggleMultiSelectWithNone(patologias, setPatologias, pat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          patologias.includes(pat)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pat}
                      </button>
                    ))}
                  </div>

                  {patologias.filter((p) => !OPCOES_PATOLOGIAS.includes(p) && p !== 'Nenhum').length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {patologias
                        .filter((p) => !OPCOES_PATOLOGIAS.includes(p) && p !== 'Nenhum')
                        .map((custom) => (
                          <span
                            key={custom}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800"
                          >
                            {custom}
                            <button
                              type="button"
                              onClick={() => removeTag(patologias, setPatologias, custom)}
                              className="hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={novaPatologia}
                      onChange={(e) => setNovaPatologia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomTag(patologias, setPatologias, novaPatologia, () => setNovaPatologia(''))
                        }
                      }}
                      placeholder="Outra patologia ou condição..."
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addCustomTag(patologias, setPatologias, novaPatologia, () => setNovaPatologia(''))}
                      className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </div>

                {/* Restrições Alimentares */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Restrições Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => toggleMultiSelectWithNone(restricoes, setRestricoes, 'Nenhum')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        restricoes.includes('Nenhum')
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Nenhum
                    </button>
                    {OPCOES_RESTRICOES.map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => toggleMultiSelectWithNone(restricoes, setRestricoes, res)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          restricoes.includes(res)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>

                  {restricoes.filter((r) => !OPCOES_RESTRICOES.includes(r) && r !== 'Nenhum').length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {restricoes
                        .filter((r) => !OPCOES_RESTRICOES.includes(r) && r !== 'Nenhum')
                        .map((custom) => (
                          <span
                            key={custom}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800"
                          >
                            {custom}
                            <button
                              type="button"
                              onClick={() => removeTag(restricoes, setRestricoes, custom)}
                              className="hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={novaRestricao}
                      onChange={(e) => setNovaRestricao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomTag(restricoes, setRestricoes, novaRestricao, () => setNovaRestricao(''))
                        }
                      }}
                      placeholder="Outra restrição alimentar..."
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addCustomTag(restricoes, setRestricoes, novaRestricao, () => setNovaRestricao(''))}
                      className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </div>

                {/* Alergias Alimentares */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Alergias Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => toggleMultiSelectWithNone(alergias, setAlergias, 'Nenhum')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        alergias.includes('Nenhum')
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Nenhum
                    </button>
                    {OPCOES_ALERGIAS.map((ale) => (
                      <button
                        key={ale}
                        type="button"
                        onClick={() => toggleMultiSelectWithNone(alergias, setAlergias, ale)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          alergias.includes(ale)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ale}
                      </button>
                    ))}
                  </div>

                  {alergias.filter((a) => !OPCOES_ALERGIAS.includes(a) && a !== 'Nenhum').length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {alergias
                        .filter((a) => !OPCOES_ALERGIAS.includes(a) && a !== 'Nenhum')
                        .map((custom) => (
                          <span
                            key={custom}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800"
                          >
                            {custom}
                            <button
                              type="button"
                              onClick={() => removeTag(alergias, setAlergias, custom)}
                              className="hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={novaAlergia}
                      onChange={(e) => setNovaAlergia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomTag(alergias, setAlergias, novaAlergia, () => setNovaAlergia(''))
                        }
                      }}
                      placeholder="Outra alergia alimentar..."
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addCustomTag(alergias, setAlergias, novaAlergia, () => setNovaAlergia(''))}
                      className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </div>

                {/* Medicamentos e Suplementos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Medicamentos Contínuos
                    </label>
                    <textarea
                      rows={2}
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Suplementos em Uso
                    </label>
                    <textarea
                      rows={2}
                      value={suplementos}
                      onChange={(e) => setSuplementos(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-ABA 3: HÁBITOS */}
            {dadosSubTab === 'habitos' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Hábitos e Rotina</h3>
                    <p className="text-xs text-slate-400">Rotina diária, hidratação e atividades</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                    Editável
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Quantas refeições faz por dia
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={refeicoesPorDia}
                      onChange={(e) => setRefeicoesPorDia(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" /> Quantidade de água por dia
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={litrosAgua}
                        onChange={(e) => setLitrosAgua(e.target.value)}
                        className="w-full pr-14 pl-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                        litros
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Horário que acorda
                    </label>
                    <input
                      type="text"
                      value={horarioAcorda}
                      onChange={(e) => setHorarioAcorda(e.target.value)}
                      onBlur={() => setHorarioAcorda(parseTimeToHHMM(horarioAcorda))}
                      placeholder="06:30"
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Horário que dorme
                    </label>
                    <input
                      type="text"
                      value={horarioDorme}
                      onChange={(e) => setHorarioDorme(e.target.value)}
                      onBlur={() => setHorarioDorme(parseTimeToHHMM(horarioDorme))}
                      placeholder="23:00"
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Pratica atividade física?
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setPraticaAtividadeFisica(true)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          praticaAtividadeFisica === true
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPraticaAtividadeFisica(false)
                          setAtividadeFisicaDescricao('')
                        }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          praticaAtividadeFisica === false
                            ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Não
                      </button>
                    </div>

                    {praticaAtividadeFisica === true && (
                      <div className="mt-4 animate-in fade-in">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Qual atividade e frequência semanal?
                        </label>
                        <input
                          type="text"
                          value={atividadeFisicaDescricao}
                          onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                          placeholder="Ex: Musculação 4x/semana..."
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Observações Gerais
                    </label>
                    <textarea
                      rows={3}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Rodapé com botão Salvar Alterações */}
            <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-end">
              <button
                type="button"
                onClick={handleSaveDados}
                disabled={savingDados}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingDados ? 'Salvando no banco...' : 'Salvar alterações'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SEÇÃO 2 — CONSULTAS (GRÁFICO DE EVOLUÇÃO, HISTÓRICO & NOVA CONSULTA) */}
      {/* =================================================================== */}
      {activeSection === 'consultas' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Gráfico de Evolução de Peso Sempre Visível (Prompt 5) */}
          <EvolucaoPesoChart
            consultas={consultas}
            pesoInicialPaciente={paciente.peso_inicial}
          />

          {/* Lista de Todas as Consultas em Ordem Cronológica Decrescente */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md shadow-slate-200/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Histórico de Consultas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consultas ordenadas da mais recente para a mais antiga
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNovaConsultaModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Consulta</span>
              </button>
            </div>

            {loadingConsultas ? (
              <div className="py-12 flex justify-center">
                <div className="w-7 h-7 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            ) : consultas.length === 0 ? (
              /* Se não houver consultas ainda */
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Nenhuma consulta registrada ainda
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                  Clique no botão "Nova Consulta" para registrar a primeira pesagem e medidas corporais.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNovaConsultaModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Primeira Consulta</span>
                </button>
              </div>
            ) : (
              /* Lista detalhada das consultas */
              <div className="space-y-4">
                {consultas.map((c, index) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 font-extrabold flex items-center justify-center text-xs">
                          #{consultas.length - index}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            Consulta: {c.data_consulta}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {index === 0 ? 'Consulta mais recente' : 'Consulta anterior'}
                          </span>
                        </div>
                      </div>

                      {c.proximo_retorno && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-100 self-start sm:self-auto">
                          <Clock className="w-3.5 h-3.5" />
                          Próximo retorno: {c.proximo_retorno}
                        </span>
                      )}
                    </div>

                    {/* Medidas registradas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Peso
                        </span>
                        <span className="text-sm font-extrabold text-emerald-700">
                          {c.peso ? `${c.peso} kg` : '--'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Cintura
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {c.cintura ? `${c.cintura} cm` : '--'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Quadril
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {c.quadril ? `${c.quadril} cm` : '--'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          % Gordura
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {c.percentual_gordura ? `${c.percentual_gordura}%` : '--'}
                        </span>
                      </div>
                    </div>

                    {/* Observações */}
                    {c.observacoes && (
                      <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/60 italic">
                        "{c.observacoes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SEÇÃO 3 — PLANOS ALIMENTARES */}
      {/* =================================================================== */}
      {activeSection === 'planos' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md shadow-slate-200/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-600" />
                  Planos Alimentares
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Histórico de dietas e planos nutricionais do paciente
                </p>
              </div>

              {/* Botão "Gerar Plano Alimentar" bem visível (Prompt 5) */}
              <button
                type="button"
                onClick={() => setShowPlanPromptNotice(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gerar Plano Alimentar</span>
              </button>
            </div>

            {/* Aviso sobre o botão ser ativado no próximo prompt conforme regra do Prompt 5 */}
            {showPlanPromptNotice && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs font-semibold">
                    A geração inteligente de planos alimentares será conectada no próximo módulo (Prompt 6).
                  </p>
                </div>
                <button
                  onClick={() => setShowPlanPromptNotice(false)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
                >
                  Entendi
                </button>
              </div>
            )}

            {/* Histórico de Planos Alimentares */}
            <div className="mt-6">
              {loadingPlanos ? (
                <div className="py-12 flex justify-center">
                  <div className="w-7 h-7 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              ) : planos.length === 0 ? (
                /* Estado vazio solicitado no Prompt 5 */
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base">
                    Nenhum plano alimentar gerado ainda
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Quando um plano alimentar for criado para este paciente, ele aparecerá aqui com seu histórico completo.
                  </p>
                </div>
              ) : (
                /* Lista de planos salvos em ordem cronológica decrescente */
                <div className="space-y-3">
                  {planos.map((plano) => (
                    <div
                      key={plano.id}
                      onClick={() => setSelectedPlano(plano)}
                      className="p-4 bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                            Plano Alimentar
                          </p>
                          <span className="text-xs text-slate-400">
                            Gerado em: {plano.data_geracao || plano.created_at}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                        <span>Ver conteúdo</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conteúdo do Plano Alimentar Selecionado */}
      {selectedPlano && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Plano Alimentar
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Gerado em: {selectedPlano.data_geracao || selectedPlano.created_at}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlano(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
              {typeof selectedPlano.conteudo === 'string'
                ? selectedPlano.conteudo
                : JSON.stringify(selectedPlano.conteudo, null, 2)}
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPlano(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Consulta */}
      <NovaConsultaModal
        pacienteId={paciente.id}
        isOpen={showNovaConsultaModal}
        onClose={() => setShowNovaConsultaModal(false)}
        onSuccess={handleConsultaSuccess}
      />
    </div>
  )
}
