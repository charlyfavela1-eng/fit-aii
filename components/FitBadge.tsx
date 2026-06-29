import { getSizeDiff, getFitLabel, getFitDescription, GarmentSize, PersonSize } from '@/lib/catalog'

interface FitBadgeProps {
  garmentSize: GarmentSize
  personSize: PersonSize
  compact?: boolean
}

export default function FitBadge({ garmentSize, personSize, compact }: FitBadgeProps) {
  const diff = getSizeDiff(garmentSize, personSize)
  const label = getFitLabel(diff)
  const desc = getFitDescription(diff)

  const styles = {
    green: {
      bar: 'bg-green-500',
      bg: 'bg-green-950/40 border-green-900/50',
      text: 'text-green-400',
      dot: 'bg-green-400',
    },
    yellow: {
      bar: 'bg-yellow-500',
      bg: 'bg-yellow-950/40 border-yellow-900/50',
      text: 'text-yellow-400',
      dot: 'bg-yellow-400',
    },
    red: {
      bar: 'bg-red-500',
      bg: 'bg-red-950/40 border-red-900/50',
      text: 'text-red-400',
      dot: 'bg-red-400',
    },
  }

  const color = diff === 0 ? 'green' : Math.abs(diff) === 1 ? 'yellow' : 'red'
  const s = styles[color]

  const fitPercent = Math.max(0, Math.min(100, 50 + diff * (-14)))

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${s.bg} ${s.text}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {label}
      </div>
    )
  }

  return (
    <div className={`rounded-2xl p-4 border ${s.bg} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${s.dot}`} />
          <span className={`font-bold text-sm ${s.text}`}>{label}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Prenda {garmentSize}</span>
          <span>→</span>
          <span>Tú {personSize}</span>
        </div>
      </div>

      {/* Fit bar */}
      <div className="flex flex-col gap-1.5">
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-blue-900/60" />
            <div className="w-px bg-gray-600" />
            <div className="flex-1 bg-red-900/60" />
          </div>
          <div
            className={`absolute top-0 h-2 w-3 rounded-full -translate-x-1/2 ${s.bar} transition-all duration-500`}
            style={{ left: `${fitPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>Muy grande</span>
          <span>Perfecto</span>
          <span>Muy chica</span>
        </div>
      </div>

      <p className="text-gray-400 text-xs leading-relaxed">
        Esta prenda <span className={s.text + ' font-medium'}>{desc}</span>
      </p>
    </div>
  )
}
