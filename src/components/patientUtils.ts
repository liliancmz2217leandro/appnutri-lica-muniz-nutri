// Utilitários para Pacientes, Formatações, IMC e Validações

export interface Paciente {
  id: string
  nutricionista_id: string
  nome: string
  data_nascimento?: string | null
  sexo?: string | null
  telefone?: string | null
  whatsapp?: string | null
  email?: string | null
  peso_inicial?: number | null
  altura?: number | null
  objetivos?: string[] | null
  objetivo_texto?: string | null
  nivel_atividade?: string | null
  patologias?: string[] | null
  restricoes_alimentares?: string[] | null
  alergias?: string[] | null
  medicamentos?: string | null
  suplementos?: string | null
  refeicoes_por_dia?: number | null
  horario_acorda?: string | null
  horario_dorme?: string | null
  litros_agua?: number | null
  atividade_fisica?: boolean | null
  atividade_fisica_descricao?: string | null
  observacoes?: string | null
  created_at?: string
  ultima_consulta?: string | null
}

export interface Consulta {
  id: string
  paciente_id: string
  data_consulta: string
  peso?: number | null
  cintura?: number | null
  quadril?: number | null
  percentual_gordura?: number | null
  observacoes?: string | null
  proximo_retorno?: string | null
  created_at?: string
}

export interface PlanoAlimentar {
  id: string
  paciente_id: string
  conteudo: any
  created_at: string
  data_geracao?: string
}

// Opções pré-definidas conforme Prompt 4
export const OPCOES_OBJETIVOS = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
]

export const OPCOES_ATIVIDADE_FISICA = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
]

export const OPCOES_PATOLOGIAS = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
]

export const OPCOES_RESTRICOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
]

export const OPCOES_ALERGIAS = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
]

// Cálculo de Idade
export function calculateAge(birthDateStr?: string | null): number | null {
  if (!birthDateStr) return null
  const birth = new Date(birthDateStr)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

// Formatação de Telefone e WhatsApp: (11) 98765-4321 ou (11) 3456-7890
export function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

// Converte número digitado para formato de hora (ex: 6 -> 06:00, 630 -> 06:30, 23 -> 23:00, 2230 -> 22:30)
export function parseTimeToHHMM(input: string): string {
  if (!input) return ''
  const trimmed = input.trim().replace(':', '')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return input

  const num = parseInt(digits, 10)
  if (isNaN(num)) return input

  // Se tem 1 ou 2 dígitos (ex: 6 -> 06:00, 23 -> 23:00)
  if (digits.length === 1 || digits.length === 2) {
    const hour = Math.min(23, Math.max(0, num))
    return `${String(hour).padStart(2, '0')}:00`
  }

  // Se tem 3 dígitos (ex: 630 -> 06:30, 845 -> 08:45)
  if (digits.length === 3) {
    const hour = Math.min(23, Math.max(0, parseInt(digits.slice(0, 1), 10)))
    const min = Math.min(59, Math.max(0, parseInt(digits.slice(1), 10)))
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }

  // Se tem 4 dígitos (ex: 2230 -> 22:30, 0745 -> 07:45)
  if (digits.length >= 4) {
    const hour = Math.min(23, Math.max(0, parseInt(digits.slice(0, 2), 10)))
    const min = Math.min(59, Math.max(0, parseInt(digits.slice(2, 4), 10)))
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }

  return input
}

// Cálculo e Classificação de IMC
export interface ImcInfo {
  valor: number
  classificacao: string
  corBadge: string
}

export function calculateIMC(pesoKg?: number | null, alturaCm?: number | null): ImcInfo | null {
  if (!pesoKg || !alturaCm || pesoKg <= 0 || alturaCm <= 0) return null
  const alturaM = alturaCm / 100
  const valor = Number((pesoKg / (alturaM * alturaM)).toFixed(1))

  let classificacao = 'Peso normal'
  let corBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200'

  if (valor < 18.5) {
    classificacao = 'Abaixo do peso'
    corBadge = 'bg-sky-50 text-sky-700 border-sky-200'
  } else if (valor <= 24.9) {
    classificacao = 'Peso normal'
    corBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  } else if (valor <= 29.9) {
    classificacao = 'Sobrepeso'
    corBadge = 'bg-amber-50 text-amber-700 border-amber-200'
  } else if (valor <= 34.9) {
    classificacao = 'Obesidade Grau I'
    corBadge = 'bg-orange-50 text-orange-700 border-orange-200'
  } else if (valor <= 39.9) {
    classificacao = 'Obesidade Grau II'
    corBadge = 'bg-rose-50 text-rose-700 border-rose-200'
  } else {
    classificacao = 'Obesidade Grau III'
    corBadge = 'bg-red-50 text-red-700 border-red-200'
  }

  return { valor, classificacao, corBadge }
}
