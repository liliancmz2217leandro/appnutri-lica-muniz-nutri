import React, { useState } from 'react'
import {
  X,
  Calendar,
  Scale,
  Ruler,
  Percent,
  CheckCircle2,
  FileText,
  Clock,
} from 'lucide-react'
import { sql } from '../lib/neon'
import { type Consulta } from './patientUtils'

interface NovaConsultaModalProps {
  pacienteId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (novaConsulta: Consulta) => void
}

export const NovaConsultaModal: React.FC<NovaConsultaModalProps> = ({
  pacienteId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dataConsulta, setDataConsulta] = useState(() => new Date().toISOString().slice(0, 10))
  const [peso, setPeso] = useState('')
  const [cintura, setCintura] = useState('')
  const [quadril, setQuadril] = useState('')
  const [percentualGordura, setPercentualGordura] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [proximoRetorno, setProximoRetorno] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!dataConsulta) {
      setError('Por favor, informe a data da consulta.')
      return
    }

    if (!peso || parseFloat(peso) <= 0) {
      setError('Por favor, informe o peso atual do paciente.')
      return
    }

    try {
      setSaving(true)
      const res = await sql`
        INSERT INTO consultas (
          paciente_id,
          data_consulta,
          peso,
          cintura,
          quadril,
          percentual_gordura,
          observacoes,
          proximo_retorno
        )
        VALUES (
          ${pacienteId},
          ${dataConsulta},
          ${parseFloat(peso)},
          ${cintura ? parseFloat(cintura) : null},
          ${quadril ? parseFloat(quadril) : null},
          ${percentualGordura ? parseFloat(percentualGordura) : null},
          ${observacoes.trim() || null},
          ${proximoRetorno || null}
        )
        RETURNING 
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
      `

      if (res && res[0]) {
        onSuccess(res[0] as Consulta)
        onClose()
      }
    } catch (err: any) {
      console.error('Erro ao salvar consulta no Neon:', err)
      setError('Ocorreu um erro ao registrar a consulta no banco de dados.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Nova Consulta</h3>
              <p className="text-[11px] text-slate-400">
                Registre os dados de avaliação do paciente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data da Consulta & Peso Atual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Data da Consulta *
              </label>
              <input
                type="date"
                required
                value={dataConsulta}
                onChange={(e) => setDataConsulta(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                Peso Atual (kg) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 73.2"
                  className="w-full pr-10 pl-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                  kg
                </span>
              </div>
            </div>
          </div>

          {/* Medidas Opcionais: Cintura, Quadril e % Gordura */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Ruler className="w-3 h-3 text-teal-600" />
                Cintura
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={cintura}
                  onChange={(e) => setCintura(e.target.value)}
                  placeholder="80"
                  className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Ruler className="w-3 h-3 text-teal-600" />
                Quadril
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={quadril}
                  onChange={(e) => setQuadril(e.target.value)}
                  placeholder="98"
                  className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Percent className="w-3 h-3 text-indigo-600" />
                % Gordura
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={percentualGordura}
                  onChange={(e) => setPercentualGordura(e.target.value)}
                  placeholder="22.5"
                  className="w-full pr-7 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Próximo Retorno */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Próximo Retorno (opcional)
            </label>
            <input
              type="date"
              value={proximoRetorno}
              onChange={(e) => setProximoRetorno(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observações da Consulta
            </label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Evolução clínica, feedback da dieta anterior, queixas, metas para o próximo mês..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Ações do Formulário */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Salvando no banco...' : 'Salvar Consulta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
