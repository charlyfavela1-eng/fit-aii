'use client'

import { useState, useEffect } from 'react'
import { getSavedItems, removeItem, SavedItem } from '@/lib/my-catalog'
import { Garment } from '@/lib/catalog'

let itemId = 0

interface MyCatalogProps {
  selected: Garment | null
  onSelect: (g: Garment) => void
}

export default function MyCatalog({ selected, onSelect }: MyCatalogProps) {
  const [items, setItems] = useState<SavedItem[]>([])

  useEffect(() => { setItems(getSavedItems()) }, [])

  const handleRemove = (id: string) => {
    removeItem(id)
    setItems(getSavedItems())
  }

  const handleSelect = (item: SavedItem) => {
    const g: Garment = {
      id: `saved-${itemId++}`,
      name: item.name.slice(0, 60),
      brand: item.brand || item.source,
      size: 'M',
      color: '',
      colorHex: '#888888',
      type: 'prenda guardada',
      category: 'tops',
      description: item.name,
      price: item.priceNum,
      emoji: '🔖',
      image: item.image || undefined,
      buyUrl: item.buyUrl,
      measurements: { chest: 108, waist: 104, length: 72 },
      tags: ['mi catalogo', item.gender],
    }
    onSelect(g)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-14 animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center text-4xl">
            🔖
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">0</span>
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold text-white mb-1">Tu catálogo está vacío</p>
          <p className="text-gray-500 text-sm max-w-xs">
            Guarda prendas que encuentres en la búsqueda con el botón 🔖 y aparecerán aquí
          </p>
        </div>
        <div className="glass px-4 py-3 rounded-xl text-center max-w-xs">
          <p className="text-xs text-gray-400 leading-relaxed">
            💡 <strong className="text-gray-300">Tip:</strong> Busca en internet, guarda las que te gusten y pruébatelas todas aquí
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{items.length} prenda{items.length !== 1 ? 's' : ''} guardada{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { items.forEach(i => removeItem(i.id)); setItems([]) }}
          className="text-xs text-red-500/70 hover:text-red-400 transition"
        >
          Borrar todo
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map(item => {
          const isSelected = selected?.buyUrl === item.buyUrl
          return (
            <div
              key={item.id}
              className={`relative flex flex-col rounded-2xl overflow-hidden transition ${isSelected ? 'card-selected' : 'card'}`}
            >
              {/* Image */}
              <button onClick={() => handleSelect(item)} className="relative w-full focus:outline-none">
                <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(item.image)}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={e => {
                        const el = e.target as HTMLImageElement
                        el.style.display = 'none'
                        el.parentElement!.innerHTML = '<span style="font-size:2rem;display:flex;align-items:center;justify-content:center;height:100%">🔖</span>'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-white/5 aspect-[3/4]">🔖</div>
                  )}
                  {/* Overlay info */}
                  <div className="absolute inset-x-0 bottom-0 card-overlay p-2">
                    {item.brand && (
                      <p className="text-[10px] text-white/70 uppercase tracking-wider">{item.brand}</p>
                    )}
                    <p className="text-xs text-white font-bold leading-tight line-clamp-2">{item.name}</p>
                    {item.price && (
                      <p className="text-brand-400 text-xs font-bold mt-0.5">{item.price}</p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#0ea5e922', border: '1px solid #0ea5e955', color: '#7dd3fc' }}>
                    🔖 Guardado
                  </span>
                </div>
              </button>

              {/* Actions */}
              <div className="p-2 flex gap-1.5">
                <a
                  href={item.buyUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  🛍️ Comprar
                </a>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="w-8 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 transition"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
