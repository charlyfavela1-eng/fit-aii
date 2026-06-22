'use client'

import { useState } from 'react'
import { catalog, Garment } from '@/lib/catalog'

interface CatalogPickerProps {
  selected: Garment | null
  onSelect: (g: Garment) => void
}

const categories = [
  { id: 'all', label: 'Todo' },
  { id: 'tops', label: 'Tops' },
  { id: 'outerwear', label: 'Exteriores' },
  { id: 'dresses', label: 'Vestidos' },
]

export default function CatalogPicker({ selected, onSelect }: CatalogPickerProps) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = activeCategory === 'all'
    ? catalog
    : catalog.filter(g => g.category === activeCategory)

  return (
    <div className="flex flex-col gap-4">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
              activeCategory === cat.id
                ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(garment => (
          <button
            key={garment.id}
            onClick={() => onSelect(garment)}
            className={`relative flex flex-col rounded-2xl overflow-hidden text-left transition ${
              selected?.id === garment.id ? 'card-selected' : 'card'
            }`}
          >
            {/* Color swatch + emoji */}
            <div
              className="h-36 flex items-center justify-center text-6xl relative"
              style={{ backgroundColor: garment.colorHex + '22' }}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `radial-gradient(ellipse at 50% 30%, ${garment.colorHex}55 0%, transparent 70%)`,
                }}
              />
              <span className="relative z-10 drop-shadow-lg" style={{ fontSize: 56 }}>
                {garment.emoji}
              </span>
              {selected?.id === garment.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col gap-1">
              <p className="font-bold text-sm leading-tight">{garment.name}</p>
              <p className="text-gray-400 text-xs">{garment.color}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                  Talla {garment.size}
                </span>
                <span className="text-brand-400 text-xs font-bold">
                  ${garment.price.toLocaleString('es-MX')}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
