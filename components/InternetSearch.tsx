'use client'

import { useState, useCallback } from 'react'
import { Garment } from '@/lib/catalog'
import { saveItem, isItemSaved, getSavedItems } from '@/lib/my-catalog'

interface SearchResult {
  title: string
  brand: string
  price: string
  priceNum: number
  imageUrl: string
  buyUrl: string
  source: string
  isProductUrl: boolean
}

interface InternetSearchProps {
  onSelect: (g: Garment) => void
  selected: Garment | null
  gender: 'mujer' | 'hombre' | 'mama'
}

type Store = 'all' | 'temu' | 'amazon' | 'shein'

const STORE_LABELS: Record<Store, string> = {
  all:    '🌐 Todas',
  temu:   '🛍️ Temu',
  amazon: '📦 Amazon MX',
  shein:  '👗 Shein',
}

const CHIPS: Record<'mujer' | 'hombre' | 'mama', string[]> = {
  mujer: [
    'vestido midi casual',
    'vestido floral mujer',
    'blusa elegante',
    'conjunto pantalón wide leg',
    'vestido lino mujer',
    'top off shoulder',
    'blazer mujer elegante',
  ],
  hombre: [
    'polo negro minimalista',
    'camisa negra slim fit',
    'mock neck negro hombre',
    'polo lino blanco old money',
    'camisa oversize negra',
    'camisa lino negro hombre',
    'polo piqué negro',
  ],
  mama: [
    'blusa floral manga larga',
    'conjunto cómodo dos piezas',
    'vestido casual señora',
    'blusa bordada mujer',
    'cardigan suave punto',
    'pantalón elástico cómodo',
    'vestido verano manga corta',
    'blusa suelta estampada',
  ],
}

const PROVIDER_LABEL: Record<string, string> = {
  'google-shopping':  '✅ Google Shopping — links de producto garantizados',
  'tienda-directa':   '✅ Búsqueda directa en tienda',
  'duckduckgo':       '🌐 DuckDuckGo',
  'duckduckgo-html':  '🌐 DuckDuckGo',
  'serper':           '✅ Google Shopping',
  'brave':            '🌐 Brave Search',
}

let resultId = 0

export default function InternetSearch({ onSelect, selected, gender }: InternetSearchProps) {
  const [query, setQuery]         = useState('')
  const [store, setStore]         = useState<Store>(gender === 'mama' ? 'temu' : 'all')
  const [results, setResults]     = useState<SearchResult[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [searched, setSearched]   = useState(false)
  const [provider, setProvider]   = useState('')
  const [savedIds, setSavedIds]   = useState<Set<string>>(() => new Set(getSavedItems().map(i => i.id)))

  const search = useCallback(async (q: string, overrideStore?: Store) => {
    if (!q.trim()) return
    setQuery(q)
    setLoading(true)
    setError(null)
    setSearched(true)
    setResults([])

    const activeStore = overrideStore ?? store
    const siteParam = activeStore === 'all' ? '' : `&site=${activeStore}`

    try {
      const res = await fetch(
        `/api/search-garments?q=${encodeURIComponent(q)}&gender=${gender}${siteParam}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al buscar')
      setResults(data.results ?? [])
      setProvider(data.provider ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al buscar')
    } finally {
      setLoading(false)
    }
  }, [gender, store])

  const selectResult = (item: SearchResult) => {
    const g: Garment = {
      id: `search-${resultId++}`,
      name: item.title.slice(0, 60),
      brand: item.brand || item.source,
      size: 'M',
      color: '',
      colorHex: '#888888',
      type: query,
      category: gender === 'mujer' || gender === 'mama' ? 'dresses' : 'tops',
      description: item.title,
      price: item.priceNum,
      emoji: '🔍',
      image: item.imageUrl,
      buyUrl: item.buyUrl,
      measurements: { chest: 108, waist: 104, length: 72 },
      tags: ['busqueda internet', gender, query.toLowerCase()],
    }
    onSelect(g)
  }

  const handleSave = (item: SearchResult) => {
    const id = `saved-${item.buyUrl}`
    saveItem({
      id,
      name: item.title.slice(0, 80),
      brand: item.brand || item.source,
      image: item.imageUrl,
      price: item.price,
      priceNum: item.priceNum,
      buyUrl: item.buyUrl,
      source: item.source,
      gender,
    })
    setSavedIds(prev => new Set([...prev, id]))
    if (navigator.vibrate) navigator.vibrate(50)
  }

  const handleStoreChange = (s: Store) => {
    setStore(s)
    if (query.trim()) search(query, s)
  }

  const chips = CHIPS[gender]
  const productResults = results.filter(r => r.isProductUrl)
  const nonProductResults = results.filter(r => !r.isProductUrl)
  // Always show only product URLs — that's the whole point
  const visibleResults = productResults.length > 0 ? productResults : results

  return (
    <div className="flex flex-col gap-3">

      {/* Store filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {(Object.keys(STORE_LABELS) as Store[]).map(s => (
          <button
            key={s}
            onClick={() => handleStoreChange(s)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              store === s
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                : 'glass text-gray-500 hover:text-gray-300'
            }`}
          >
            {STORE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none">🔍</span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(query)}
            placeholder={
              store === 'temu'   ? 'blusa, conjunto, vestido en Temu…' :
              store === 'amazon' ? 'buscar en Amazon México…' :
              store === 'shein'  ? 'buscar en Shein…' :
              gender === 'mujer' ? 'vestido, blusa, conjunto…' : 'guayabera, polo, lino…'
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition"
          />
        </div>
        <button
          onClick={() => search(query)}
          disabled={loading || !query.trim()}
          className="btn-primary px-4 py-3 text-sm disabled:opacity-40"
        >
          {loading ? '…' : 'Buscar'}
        </button>
      </div>

      {/* Style chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {chips.map(chip => (
          <button
            key={chip}
            onClick={() => search(chip)}
            className="flex-shrink-0 glass px-3 py-1.5 rounded-full text-xs text-gray-400 hover:text-white transition"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
          <p className="text-gray-500 text-sm">
            Buscando en {store === 'all' ? 'Temu y Amazon' : STORE_LABELS[store]}…
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <p className="text-red-400 text-sm text-center py-4">{error}</p>
      )}

      {/* No results */}
      {searched && !loading && !error && results.length === 0 && (
        <div className="text-center py-10 text-gray-600">
          <p className="text-3xl mb-2">🔎</p>
          <p className="text-sm">Sin resultados — prueba otra búsqueda</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <div className="flex flex-col gap-3">
          {/* Summary row */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500">
                {visibleResults.length} prenda{visibleResults.length !== 1 ? 's' : ''} con link de compra
              </p>
              {provider && (
                <p className="text-[10px] text-gray-700 mt-0.5">
                  {PROVIDER_LABEL[provider] ?? provider}
                </p>
              )}
            </div>
            {nonProductResults.length > 0 && productResults.length > 0 && (
              <span className="text-[10px] text-gray-700">
                +{nonProductResults.length} sin link directo
              </span>
            )}
          </div>

          {/* Empty products — show all */}
          {productResults.length === 0 && results.length > 0 && (
            <div className="glass rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-500">
                No se encontraron links directos de producto. Prueba cambiar la tienda o el término de búsqueda.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {visibleResults.map((item, i) => {
              const isSelected = selected?.buyUrl === item.buyUrl
              const savedId    = `saved-${item.buyUrl}`
              const saved      = savedIds.has(savedId)

              return (
                <div
                  key={i}
                  className={`relative flex flex-col rounded-2xl overflow-hidden transition ${isSelected ? 'card-selected' : 'card'} animate-slide-up`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {/* Image — tap to seleccionar para try-on */}
                  <button onClick={() => selectResult(item)} className="relative w-full focus:outline-none">
                    <div className="relative overflow-hidden bg-white/5" style={{ aspectRatio: '3/4' }}>
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={e => {
                            const el = e.target as HTMLImageElement
                            el.style.display = 'none'
                            el.parentElement!.innerHTML = '<span style="font-size:2rem;display:flex;align-items:center;justify-content:center;height:100%;color:#4b5563">🛍️</span>'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">🛍️</div>
                      )}

                      {/* Overlay info */}
                      <div className="absolute inset-x-0 bottom-0 card-overlay p-2">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">{item.source}</p>
                        <p className="text-xs text-white font-bold leading-tight line-clamp-2">{item.title}</p>
                        {item.price && (
                          <p className="text-brand-400 text-sm font-black mt-0.5">{item.price}</p>
                        )}
                      </div>

                      {/* Selected check */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Action buttons */}
                  <div className="p-2 flex gap-1.5">
                    {/* BUY — primary action, always visible */}
                    <a
                      href={item.buyUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition"
                      style={{
                        background: 'linear-gradient(135deg, #f97316, #fb923c)',
                        color: '#fff',
                      }}
                    >
                      Comprar ↗
                    </a>

                    {/* Save */}
                    <button
                      onClick={() => !saved && handleSave(item)}
                      disabled={saved}
                      title={saved ? 'Guardado' : 'Guardar en mi catálogo'}
                      className={`w-9 flex items-center justify-center rounded-xl text-sm transition ${
                        saved ? 'text-brand-400' : 'text-gray-600 hover:text-brand-400'
                      }`}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {saved ? '🔖' : '＋'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
