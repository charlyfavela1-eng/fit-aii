'use client'

import { useRef, useState } from 'react'
import { Garment, GarmentSize, prendaExterna } from '@/lib/catalog'

interface Props {
  personSize: GarmentSize
  selected: Garment | null
  onSelect: (g: Garment) => void
}

interface Hallazgo {
  imagen: string
  titulo: string
  fuente?: string
  enlace?: string
}

/* Traer prendas de fuera del catalogo. Tres entradas, porque cada una falla
 * donde la otra funciona:
 *
 *   Buscar   comodo, pero da miniaturas de Google y cuesta por consulta.
 *   Enlace   pegas la URL del producto y sale su foto oficial. Gratis y exacto.
 *   Subir    para cuando la tienda no publica `og:image` o la foto es tuya.
 */
export default function GarmentSearch({ personSize, selected, onSelect }: Props) {
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([])
  const archivoRef = useRef<HTMLInputElement>(null)

  const esEnlace = /^https?:\/\//i.test(texto.trim())

  const buscar = async () => {
    const q = texto.trim()
    if (!q) return
    setCargando(true)
    setError(null)
    setHallazgos([])
    try {
      const param = esEnlace ? `url=${encodeURIComponent(q)}` : `q=${encodeURIComponent(q)}`
      const res = await fetch(`/api/buscar?${param}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      if (!data.prendas?.length) throw new Error('No se encontro ninguna prenda')
      setHallazgos(data.prendas)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fallo la busqueda')
    } finally {
      setCargando(false)
    }
  }

  const subir = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Eso no es una imagen'); return }
    if (file.size > 8 * 1024 * 1024) { setError('La imagen pesa mas de 8 MB'); return }
    const lector = new FileReader()
    lector.onload = () => {
      const base64 = String(lector.result)
      setHallazgos([{ imagen: base64, titulo: file.name.replace(/\.[^.]+$/, ''), fuente: 'Tu galeria' }])
      setError(null)
    }
    lector.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') buscar() }}
          placeholder="Busca “chamarra de mezclilla” o pega el enlace"
          className="flex-1 glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          onClick={buscar}
          disabled={cargando || !texto.trim()}
          className="btn-primary px-4 rounded-xl text-sm disabled:opacity-40"
        >
          {cargando ? '…' : esEnlace ? 'Traer' : 'Buscar'}
        </button>
      </div>

      <button
        onClick={() => archivoRef.current?.click()}
        className="glass rounded-xl py-2.5 text-xs text-gray-400 hover:text-white transition"
      >
        📁 O sube la foto de la prenda desde tu galeria
      </button>
      <input
        ref={archivoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) subir(f) }}
      />

      {error && (
        <p className="text-red-400/80 text-xs px-1">{error}</p>
      )}

      {hallazgos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {hallazgos.map((h, i) => {
            const activa = selected?.imageUrl === h.imagen
            return (
              <button
                key={i}
                onClick={() => onSelect(prendaExterna(h.imagen, h.titulo, personSize, h.fuente))}
                className={`relative rounded-xl overflow-hidden aspect-[3/4] transition ${
                  activa ? 'ring-2 ring-brand-500' : 'ring-1 ring-white/10'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.imagen} alt={h.titulo} className="w-full h-full object-cover" />
                {activa && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-[10px]">
                    ✓
                  </div>
                )}
                {h.fuente && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-gray-300 px-1 py-0.5 truncate">
                    {h.fuente}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
