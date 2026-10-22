import React, { useState } from 'react'
import { TrendingDown, TrendingUp, Minus, Scale, Activity } from 'lucide-react'
import { type Consulta } from './patientUtils'

interface EvolucaoPesoChartProps {
  consultas: Consulta[]
  pesoInicialPaciente?: number | null
}

export const EvolucaoPesoChart: React.FC<EvolucaoPesoChartProps> = ({
  consultas,
  pesoInicialPaciente,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string
    peso: number
    x: number
    y: number
  } | null>(null)

  // Filtra apenas consultas com peso válido e ordena por data crescente para a linha do tempo
  const validData = [...consultas]
    .filter((c) => c.peso !== null && c.peso !== undefined && Number(c.peso) > 0)
    .sort((a, b) => {
      // parse DD/MM/YYYY or YYYY-MM-DD
      const parseDate = (d: string) => {
        if (d.includes('/')) {
          const [day, month, year] = d.split('/')
          return new Date(`${year}-${month}-${day}`).getTime()
        }
        return new Date(d).getTime()
      }
      return parseDate(a.data_consulta) - parseDate(b.data_consulta)
    })

  // Se não houver dados válidos de consulta
  if (validData.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md shadow-slate-200/30">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Evolução do Peso
              </h3>
              <p className="text-[11px] text-slate-400">
                Acompanhamento da pesagem ao longo das consultas
              </p>
            </div>
          </div>
          {pesoInicialPaciente && (
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
              Peso cadastrado: {pesoInicialPaciente} kg
            </span>
          )}
        </div>

        {/* Empty State específico exigido no Prompt 5 */}
        <div className="h-56 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center shadow-xs mb-3">
            <Scale className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            Nenhuma consulta registrada ainda
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Registre uma nova consulta para visualizar o gráfico de evolução de peso deste paciente.
          </p>
        </div>
      </div>
    )
  }

  // Estatísticas do gráfico
  const pesoInicial = Number(validData[0].peso)
  const pesoAtual = Number(validData[validData.length - 1].peso)
  const diferencaTotal = Number((pesoAtual - pesoInicial).toFixed(1))

  // Dimensões do SVG
  const width = 640
  const height = 220
  const paddingLeft = 55
  const paddingRight = 35
  const paddingTop = 25
  const paddingBottom = 40

  const pesos = validData.map((d) => Number(d.peso))
  const minPesoVal = Math.min(...pesos)
  const maxPesoVal = Math.max(...pesos)

  // Faixa de peso com margem visual
  const range = maxPesoVal - minPesoVal
  const minPeso = Math.floor(minPesoVal - (range > 0 ? range * 0.15 : 2))
  const maxPeso = Math.ceil(maxPesoVal + (range > 0 ? range * 0.15 : 2))
  const deltaPeso = Math.max(1, maxPeso - minPeso)

  // Coordenadas dos pontos
  const points = validData.map((item, index) => {
    const x =
      validData.length === 1
        ? width / 2
        : paddingLeft +
          (index / (validData.length - 1)) * (width - paddingLeft - paddingRight)
    const y =
      paddingTop +
      (1 - (Number(item.peso) - minPeso) / deltaPeso) *
        (height - paddingTop - paddingBottom)
    return {
      x,
      y,
      date: item.data_consulta,
      peso: Number(item.peso),
    }
  })

  // Caminho da linha
  const pathData =
    points.length === 1
      ? ''
      : points.reduce(
          (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
          ''
        )

  // Área preenchida sob a curva
  const areaData =
    points.length <= 1
      ? ''
      : `${pathData} L ${points[points.length - 1].x} ${
          height - paddingBottom
        } L ${points[0].x} ${height - paddingBottom} Z`

  // Linhas guia do eixo Y (3 linhas)
  const yGuides = [
    { val: maxPeso, y: paddingTop },
    { val: Math.round((maxPeso + minPeso) / 2), y: (paddingTop + height - paddingBottom) / 2 },
    { val: minPeso, y: height - paddingBottom },
  ]

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md shadow-slate-200/30">
      {/* Top Header do Gráfico com Indicadores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Evolução do Peso
            </h3>
            <p className="text-[11px] text-slate-400">
              Registrado em cada consulta ao longo do tratamento
            </p>
          </div>
        </div>

        {/* Resumo Numérico */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Início
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-700">
              {pesoInicial} kg
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Atual
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-700">
              {pesoAtual} kg
            </span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
            diferencaTotal < 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : diferencaTotal > 0
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            {diferencaTotal < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : diferencaTotal > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
            <span className="text-xs sm:text-sm font-extrabold">
              {diferencaTotal > 0 ? `+${diferencaTotal}` : diferencaTotal} kg
            </span>
          </div>
        </div>
      </div>

      {/* Visualização SVG Interativa */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minHeight: '190px' }}
        >
          <defs>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de grade horizontal */}
          {yGuides.map((guide, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={guide.y}
                x2={width - paddingRight}
                y2={guide.y}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={guide.y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-semibold"
              >
                {guide.val} kg
              </text>
            </g>
          ))}

          {/* Área preenchida sob a curva */}
          {areaData && <path d={areaData} fill="url(#emeraldGradient)" />}

          {/* Linha principal */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="#059669"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Ponto único (caso tenha apenas 1 consulta) */}
          {points.length === 1 && (
            <line
              x1={paddingLeft}
              y1={points[0].y}
              x2={width - paddingRight}
              y2={points[0].y}
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.6"
            />
          )}

          {/* Pontos de medição */}
          {points.map((p, idx) => (
            <g key={idx} className="cursor-pointer">
              {/* Círculo pulsante externo ao passar o mouse */}
              {hoveredPoint?.date === p.date && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="8"
                  fill="#10b981"
                  opacity="0.25"
                  className="animate-ping"
                />
              )}
              {/* Círculo base */}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredPoint?.date === p.date ? '6' : '4.5'}
                fill="#ffffff"
                stroke="#059669"
                strokeWidth="3"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* Rótulo de data no eixo X */}
              <text
                x={p.x}
                y={height - 15}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-medium"
              >
                {p.date.length > 5 ? p.date.slice(0, 5) : p.date}
              </text>
            </g>
          ))}
        </svg>

        {/* Tooltip dinâmico */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xl border border-slate-800 transition-all"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
            }}
          >
            <p className="text-[10px] text-slate-300 font-normal">{hoveredPoint.date}</p>
            <p className="text-emerald-400 font-bold">{hoveredPoint.peso} kg</p>
          </div>
        )}
      </div>
    </div>
  )
}
