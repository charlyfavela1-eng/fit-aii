'use client'

import { catalog, Garment } from '@/lib/catalog'

interface CatalogPickerProps {
  selected: Garment | null
  onSelect: (g: Garment) => void
}

const sizeColors: Record<string, string> = {
  XS: 'bg-purple-700',
  S: 'bg-blue-700',
  M: 'bg-green-700',
  L: 'bg-yellow-700',
  XL: 'bg-orange-700',
  XXL: 'bg-red-700',
}

export default function CatalogPicker({ selected, onSelect }: CatalogPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {catalog.map(garment => (
        <button
          key={garment.id}
          onClick={() => onSelect(garment)}
          className={`relative flex flex-col rounded-2xl overflow-hidden border-2 transition text-left ${
            selected?.id === garment.id
              ? 'border-sky-400 shadow-lg shadow-sky-900/50'
              : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          <div className="h-40 bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-6xl">
            {garment.type === 'hoodie' ? '🧥' :
             garment.type === 'camiseta' ? '👕' :
             garment.type === 'chamarra' ? '🥼' :
             garment.type === 'vestido' ? '👗' : '👔'}
          </div>
          <div className="p-3 bg-gray-900 flex-1">
            <p className="font-semibold text-sm leading-tight">{garment.name}</p>
            <p className="text-gray-400 text-xs mt-0.5">{garment.color}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`${sizeColors[garment.size]} text-xs font-bold px-2 py-0.5 rounded-full`}>
                {garment.size}
              </span>
              <span className="text-gray-500 text-xs">{garment.type}</span>
            </div>
          </div>
          {selected?.id === garment.id && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-xs font-bold">
              ✓
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
