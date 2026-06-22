import { getSizeDiff, getFitDescription, GarmentSize, PersonSize } from '@/lib/catalog'

interface FitBadgeProps {
  garmentSize: GarmentSize
  personSize: PersonSize
}

export default function FitBadge({ garmentSize, personSize }: FitBadgeProps) {
  const diff = getSizeDiff(garmentSize, personSize)
  const desc = getFitDescription(diff)

  const color =
    diff === 0 ? 'bg-green-700 text-green-100' :
    Math.abs(diff) === 1 ? 'bg-yellow-700 text-yellow-100' :
    'bg-red-800 text-red-100'

  const icon =
    diff > 0 ? '📏 Talla ' + garmentSize + ' — te quedará grande' :
    diff < 0 ? '📏 Talla ' + garmentSize + ' — te quedará pequeña' :
    '📏 Talla perfecta'

  return (
    <div className={`rounded-xl px-4 py-3 text-sm ${color}`}>
      <p className="font-bold">{icon}</p>
      <p className="text-xs mt-1 opacity-80">Se verá {desc}</p>
    </div>
  )
}
