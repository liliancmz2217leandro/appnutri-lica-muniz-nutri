import React, { useState } from 'react'
import {
  User,
  Activity,
  Heart,
  Phone,
  Mail,
  Scale,
  Ruler,
  Clock,
  Droplets,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { sql, type UserSession } from '../lib/neon'
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
} from './patientUtils'

interface NovoPacienteFormProps {
  user: UserSession
  onCancel: () => void
  onSuccess: (pacienteCriado: Paciente) => void
}

export const NovoPacienteForm: React.FC<NovoPacienteFormProps> = ({
  user,
  onCancel,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal')
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // --- ABA 1: PESSOAL ---
  const [nome, setNome] = useState('')
  const [dataInicioTratamento, setDataInicioTratamento] = useState(() => new Date().toISOString().slice(0, 10))
  const [dataNascimento, setDataNascimento] = useState('')
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro' | ''>('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  // --- ABA 2: CLÍNICO ---
  const [pesoKg, setPesoKg] = useState<string>('')
  const [alturaCm, setAlturaCm] = useState<string>('')
  const [objetivos, setObjetivos] = useState<string[]>([])
  const [objetivoTexto, setObjetivoTexto] = useState('')
  const [nivelAtividade, setNivelAtividade] = useState('')

  // Patologias com "Nenhum" e tags customizadas
  const [patologias, setPatologias] = useState<string[]>([])
  const [novaPatologia, setNovaPatologia] = useState('')

  // Restrições com "Nenhum" e tags customizadas
  const [restricoes, setRestricoes] = useState<string[]>([])
  const [novaRestricao, setNovaRestricao] = useState('')

  // Alergias com "Nenhum" e tags customizadas
  const [alergias, setAlergias] = useState<string[]>([])
  const [novaAlergia, setNovaAlergia] = useState('')

  const [medicamentos, setMedicamentos] = useState('')
  const [suplementos, setSuplementos] = useState('')

  // --- ABA 3: HÁBITOS ---
  const [refeicoesPorDia, setRefeicoesPorDia] = useState<string>('')
  const [horarioAcorda, setHorarioAcorda] = useState('')
  const [horarioDorme, setHorarioDorme] = useState('')
  const [litrosAgua, setLitrosAgua] = useState<string>('')
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState<boolean | null>(null)
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Cálculos dinâmicos
  const idade = calculateAge(dataNascimento)
  const imcInfo = calculateIMC(
    pesoKg ? parseFloat(pesoKg) : null,
    alturaCm ? parseFloat(alturaCm) : null
  )

  // Manipuladores de Múltipla Escolha com "Nenhum"
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

  // Manipulador de Objetivos (múltipla escolha)
  const toggleObjetivo = (item: string) => {
    if (objetivos.includes(item)) {
      setObjetivos(objetivos.filter((o) => o !== item))
    } else {
      setObjetivos([...objetivos, item])
    }
  }

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!nome.trim()) {
      setActiveTab('pessoal')
      setErrorMessage('O nome completo é obrigatório para cadastrar o paciente.')
      return
    }

    try {
      setSaving(true)

      // Conversão segura de valores
      const alturaParaBanco = alturaCm ? Number((parseFloat(alturaCm) / 100).toFixed(2)) : null
      const pesoParaBanco = pesoKg ? parseFloat(pesoKg) : null
      const aguaParaBanco = litrosAgua ? parseFloat(litrosAgua) : null
      const refeicoesParaBanco = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null

      const res = await sql`
        INSERT INTO pacientes (
          nutricionista_id,
          nome,
          data_nascimento,
          sexo,
          telefone,
          whatsapp,
          email,
          peso_inicial,
          altura,
          objetivos,
          objetivo_texto,
          nivel_atividade,
          patologias,
          restricoes_alimentares,
          alergias,
          medicamentos,
          suplementos,
          refeicoes_por_dia,
          horario_acorda,
          horario_dorme,
          litros_agua,
          atividade_fisica,
          atividade_fisica_descricao,
          observacoes
        )
        VALUES (
          ${user.id},
          ${nome.trim()},
          ${dataNascimento || null},
          ${sexo || null},
          ${telefone.trim() || null},
          ${whatsapp.trim() || null},
          ${email.trim() || null},
          ${pesoParaBanco},
          ${alturaParaBanco},
          ${objetivos.length > 0 ? objetivos : null},
          ${objetivoTexto.trim() || null},
          ${nivelAtividade || null},
          ${patologias.length > 0 ? patologias : null},
          ${restricoes.length > 0 ? restricoes : null},
          ${alergias.length > 0 ? alergias : null},
          ${medicamentos.trim() || null},
          ${suplementos.trim() || null},
          ${refeicoesParaBanco},
          ${horarioAcorda.trim() || null},
          ${horarioDorme.trim() || null},
          ${aguaParaBanco},
          ${praticaAtividadeFisica},
          ${praticaAtividadeFisica ? (atividadeFisicaDescricao.trim() || null) : null},
          ${observacoes.trim() || null}
        )
        RETURNING *
      `

      if (res && res[0]) {
        const novoPaciente = res[0] as Paciente

        // Registra a consulta inicial se a data de início do tratamento foi informada
        if (dataInicioTratamento) {
          try {
            await sql`
              INSERT INTO consultas (
                paciente_id,
                data_consulta,
                peso,
                observacoes
              )
              VALUES (
                ${novoPaciente.id},
                ${dataInicioTratamento},
                ${pesoParaBanco},
                'Início do tratamento / Consulta inicial'
              )
            `
          } catch (cErr) {
            console.warn('Erro ao inserir consulta inicial:', cErr)
          }
        }

        onSuccess(novoPaciente)
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente no Neon:', err)
      setErrorMessage('Ocorreu um erro ao salvar o paciente. Verifique os dados e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para lista</span>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Cadastrar Novo Paciente
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Preencha os dados organizados em Pessoal, Clínico e Hábitos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Salvando no banco...' : 'Salvar Paciente'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-2xl flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex flex-row gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'pessoal'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Pessoal</span>
          {nome.trim() && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'clinico'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Clínico</span>
          {(pesoKg || alturaCm || objetivos.length > 0) && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'habitos'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>3. Hábitos</span>
          {(litrosAgua || refeicoesPorDia || horarioAcorda) && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 ml-1" />
          )}
        </button>
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/30">
        {/* ========================================================= */}
        {/* ABA 1: PESSOAL */}
        {/* ========================================================= */}
        {activeTab === 'pessoal' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Informações Pessoais
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dados básicos de identificação e contato do paciente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome Completo */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nome Completo <span className="text-rose-500">* (obrigatório)</span>
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Mariana Silveira Souza"
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              {/* Data de Início do Tratamento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Início do Tratamento</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">(Registrada como 1ª consulta)</span>
                </label>
                <input
                  type="date"
                  value={dataInicioTratamento}
                  onChange={(e) => setDataInicioTratamento(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                />
              </div>

              {/* Data de Nascimento & Idade */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Data de Nascimento
                  </label>
                  {idade !== null && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                      {idade} {idade === 1 ? 'ano' : 'anos'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                  />
                </div>
              </div>

              {/* Sexo */}
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
                      className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        sexo === opt
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telefone */}
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
                    placeholder="(11) 98765-4321"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    WhatsApp
                  </label>
                  {telefone && (
                    <button
                      type="button"
                      onClick={() => setWhatsapp(telefone)}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer underline"
                    >
                      Copiar do telefone
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* E-mail */}
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
                    placeholder="paciente@exemplo.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Step Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('clinico')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Avançar para Clínico</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: CLÍNICO */}
        {/* ========================================================= */}
        {activeTab === 'clinico' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Dados Clínicos e Antropometria
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Medidas corporais, histórico clínico, restrições e objetivos.
              </p>
            </div>

            {/* Medidas Físicas: Peso, Altura e IMC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/60">
              {/* Peso em kg */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" /> Peso atual
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="400"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value)}
                    placeholder="72.5"
                    className="w-full pr-10 pl-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              {/* Altura em cm */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-emerald-600" /> Altura
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="30"
                    max="260"
                    value={alturaCm}
                    onChange={(e) => setAlturaCm(e.target.value)}
                    placeholder="175"
                    className="w-full pr-10 pl-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                    cm
                  </span>
                </div>
              </div>

              {/* IMC Calculado (somente leitura) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> IMC Calculado
                </label>
                <div className="h-11 px-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  {imcInfo ? (
                    <>
                      <span className="text-base font-extrabold text-slate-800">
                        {imcInfo.valor} <span className="text-[11px] font-normal text-slate-400">kg/m²</span>
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${imcInfo.corBadge}`}>
                        {imcInfo.classificacao}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Preencha peso e altura
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Objetivos (Múltipla escolha + texto livre) */}
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
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
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
                placeholder="Detalhes adicionais sobre os objetivos (ex: quer focar na perda de gordura abdominal)..."
                className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Nível de Atividade Física (Seleção única) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Nível de Atividade Física (seleção única)
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
                        : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {nv}
                  </button>
                ))}
              </div>
            </div>

            {/* Patologias ou Condições de Saúde */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Patologias ou Condições de Saúde
                </label>
                <span className="text-[11px] text-slate-400">Marque as opções ou adicione abaixo</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
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
                {OPCOES_PATOLOGIAS.map((pat) => {
                  const isSelected = patologias.includes(pat)
                  return (
                    <button
                      key={pat}
                      type="button"
                      onClick={() => toggleMultiSelectWithNone(patologias, setPatologias, pat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pat}
                    </button>
                  )
                })}
              </div>

              {/* Tags personalizadas adicionadas */}
              {patologias.filter((p) => !OPCOES_PATOLOGIAS.includes(p) && p !== 'Nenhum').length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {patologias
                    .filter((p) => !OPCOES_PATOLOGIAS.includes(p) && p !== 'Nenhum')
                    .map((custom) => (
                      <span
                        key={custom}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100/70 text-emerald-800"
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

              {/* Campo para adicionar livremente */}
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
                  placeholder="Outra patologia ou condição (pressione Enter para adicionar)..."
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Restrições Alimentares
                </label>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
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
                {OPCOES_RESTRICOES.map((res) => {
                  const isSelected = restricoes.includes(res)
                  return (
                    <button
                      key={res}
                      type="button"
                      onClick={() => toggleMultiSelectWithNone(restricoes, setRestricoes, res)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {res}
                    </button>
                  )
                })}
              </div>

              {/* Tags adicionadas livremente */}
              {restricoes.filter((r) => !OPCOES_RESTRICOES.includes(r) && r !== 'Nenhum').length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {restricoes
                    .filter((r) => !OPCOES_RESTRICOES.includes(r) && r !== 'Nenhum')
                    .map((custom) => (
                      <span
                        key={custom}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100/70 text-emerald-800"
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Alergias Alimentares
                </label>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
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
                {OPCOES_ALERGIAS.map((ale) => {
                  const isSelected = alergias.includes(ale)
                  return (
                    <button
                      key={ale}
                      type="button"
                      onClick={() => toggleMultiSelectWithNone(alergias, setAlergias, ale)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {ale}
                    </button>
                  )
                })}
              </div>

              {/* Tags adicionadas livremente */}
              {alergias.filter((a) => !OPCOES_ALERGIAS.includes(a) && a !== 'Nenhum').length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {alergias
                    .filter((a) => !OPCOES_ALERGIAS.includes(a) && a !== 'Nenhum')
                    .map((custom) => (
                      <span
                        key={custom}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100/70 text-emerald-800"
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
                  Medicamentos Contínuos (texto livre)
                </label>
                <textarea
                  rows={2}
                  value={medicamentos}
                  onChange={(e) => setMedicamentos(e.target.value)}
                  placeholder="Ex: Metformina 500mg (1x/dia), Levotiroxina 50mcg em jejum..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Suplementos em Uso (texto livre)
                </label>
                <textarea
                  rows={2}
                  value={suplementos}
                  onChange={(e) => setSuplementos(e.target.value)}
                  placeholder="Ex: Creatina 5g, Vitamina D 2000 UI, Whey Protein pós-treino..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('pessoal')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Pessoal</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('habitos')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Avançar para Hábitos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: HÁBITOS */}
        {/* ========================================================= */}
        {activeTab === 'habitos' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-emerald-600" />
                Hábitos e Rotina Diária
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rotina de sono, hidratação, refeições diárias e atividades.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quantas refeições faz por dia */}
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
                  placeholder="Ex: 4"
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Quantidade de água por dia */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> Quantidade de água por dia
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={litrosAgua}
                    onChange={(e) => setLitrosAgua(e.target.value)}
                    placeholder="2.5"
                    className="w-full pr-14 pl-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                    litros
                  </span>
                </div>
              </div>

              {/* Horário que acorda */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Horário que acorda
                </label>
                <span className="block text-[11px] text-slate-400 mb-1.5">
                  Digite ex: 6 ou 630 (sistema formata para 06:00 ou 06:30)
                </span>
                <input
                  type="text"
                  value={horarioAcorda}
                  onChange={(e) => setHorarioAcorda(e.target.value)}
                  onBlur={() => setHorarioAcorda(parseTimeToHHMM(horarioAcorda))}
                  placeholder="Ex: 06:30"
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Horário que dorme */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Horário que dorme
                </label>
                <span className="block text-[11px] text-slate-400 mb-1.5">
                  Digite ex: 23 ou 2230 (sistema formata para 23:00 ou 22:30)
                </span>
                <input
                  type="text"
                  value={horarioDorme}
                  onChange={(e) => setHorarioDorme(e.target.value)}
                  onBlur={() => setHorarioDorme(parseTimeToHHMM(horarioDorme))}
                  placeholder="Ex: 22:30"
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Pratica Atividade Física */}
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

                {/* Se sim, abre campo de texto */}
                {praticaAtividadeFisica === true && (
                  <div className="mt-4 animate-in fade-in duration-200">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Qual atividade e frequência semanal?
                    </label>
                    <input
                      type="text"
                      value={atividadeFisicaDescricao}
                      onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                      placeholder="Ex: Musculação 4x por semana e corrida aos sábados"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Observações Gerais */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Observações Gerais (texto livre)
                </label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Histórico familiar, preferências, rotina de trabalho ou outras anotações importantes..."
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('clinico')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Clínico</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Cadastrando Paciente...' : 'Finalizar Cadastro'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
