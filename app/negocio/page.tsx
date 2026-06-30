'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  StoreGarment, StoreProfile, GarmentSize, Category, PaymentMethod,
  getStoreGarments, saveStoreGarment, deleteStoreGarment,
  getStoreProfile, saveStoreProfile, newGarmentDraft,
  CATEGORY_LABELS, CATEGORY_EMOJIS, SIZE_OPTIONS, PHOTOGRAPHY_TIPS,
  encodeCatalogLink, buildGarmentShareText, buildWhatsAppLink,
} from '@/lib/store-catalog'
import { buildPollinationsUrl, buildProductPhotoPrompt } from '@/lib/pollinations'

type Tab = 'catalog' | 'add' | 'share' | 'profile'
type View = 'setup' | 'main' | 'photo' | 'form' | 'detail'

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function NegocioPage() {
  const [view, setView]       = useState<View>('main')
  const [tab, setTab]         = useState<Tab>('catalog')
  const [profile, setProfile] = useState<StoreProfile | null>(null)
  const [garments, setGarments] = useState<StoreGarment[]>([])
  const [selected, setSelected] = useState<StoreGarment | null>(null)
  const [draft, setDraft]     = useState<Partial<StoreGarment>>({})
  const [photo, setPhoto]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    const p = getStoreProfile()
    const g = getStoreGarments()
    setProfile(p)
    setGarments(g)
    if (!p) setView('setup')
  }, [])

  const reload = () => setGarments(getStoreGarments())

  const startAdd = () => {
    setDraft(newGarmentDraft())
    setPhoto(null)
    setView('photo')
  }

  const handleSaveProfile = (p: StoreProfile) => {
    saveStoreProfile(p)
    setProfile(p)
    setView('main')
    setTab('catalog')
  }

  const handleSaveGarment = (g: StoreGarment) => {
    saveStoreGarment(g)
    reload()
    setDraft({})
    setPhoto(null)
    setView('main')
    setTab('catalog')
  }

  const handleDelete = (id: string) => {
    deleteStoreGarment(id)
    reload()
    setView('main')
    setTab('catalog')
  }

  const handleShareGarment = (g: StoreGarment) => {
    const text = buildGarmentShareText(g, profile)
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else navigator.clipboard.writeText(text).then(() => alert('Descripción copiada ✅'))
  }

  const handleCatalogLink = () => {
    if (!profile) return
    const slug = encodeCatalogLink(profile, garments)
    setShareUrl(`${window.location.origin}/c/${slug}`)
  }

  const copyShareUrl = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = garments.filter(g =>
    !search ||
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    CATEGORY_LABELS[g.category].toLowerCase().includes(search.toLowerCase())
  )

  // ── Full-screen flows (no bottom nav) ─────────────────────────────────────
  if (view === 'setup') {
    return (
      <SetupView
        initial={profile}
        onSave={handleSaveProfile}
        onSkip={profile ? () => { setView('main'); setTab('catalog') } : undefined}
      />
    )
  }

  if (view === 'photo') {
    return (
      <PhotoView
        onPhotoReady={(b64) => {
          setPhoto(b64)
          setDraft(d => ({ ...d, imageBase64: b64 }))
          setView('form')
        }}
        onBack={() => { setView('main'); setTab('catalog') }}
      />
    )
  }

  if (view === 'form') {
    return (
      <FormView
        photo={photo}
        draft={draft}
        profile={profile}
        onChange={u => setDraft(d => ({ ...d, ...u }))}
        onSave={handleSaveGarment}
        onRetakePhoto={() => setView('photo')}
        onBack={() => { setDraft({}); setPhoto(null); setView('main'); setTab('catalog') }}
      />
    )
  }

  if (view === 'detail' && selected) {
    return (
      <DetailView
        garment={selected}
        profile={profile}
        onBack={() => { setView('main'); setTab('catalog') }}
        onShare={() => handleShareGarment(selected)}
        onEdit={() => {
          setDraft({ ...selected })
          setPhoto(selected.imageBase64 ?? null)
          setView('form')
        }}
        onDelete={() => handleDelete(selected.id)}
      />
    )
  }

  // ── Main (tabs) ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* ── Header ── */}
      <header className="pt-safe px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gradient">
              {profile?.storeName || 'Mi Tienda'}
            </h1>
            <p className="text-xs text-white/30 mt-0.5">
              {garments.length} {garments.length === 1 ? 'prenda' : 'prendas'} en catálogo
            </p>
          </div>
          <Link href="/" className="glass rounded-xl px-3 py-2 text-xs text-white/40 hover:text-white transition-colors">
            ← App
          </Link>
        </div>
      </header>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-hidden">

        {/* CATALOG TAB */}
        {tab === 'catalog' && (
          <div className="h-full flex flex-col">
            <div className="px-5 pb-2">
              <input
                type="search"
                placeholder="Buscar prenda..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full glass rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-28">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="text-6xl">🛍️</div>
                  <h2 className="text-xl font-bold text-white">
                    {garments.length === 0 ? 'Catálogo vacío' : 'Sin resultados'}
                  </h2>
                  <p className="text-white/40 text-sm max-w-xs">
                    {garments.length === 0
                      ? 'Toca "+ Agregar" para subir tu primera prenda'
                      : 'Intenta con otro término'}
                  </p>
                  {garments.length === 0 && (
                    <button onClick={startAdd} className="btn-primary px-8 py-3 rounded-2xl font-bold">
                      + Agregar primera prenda
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {filtered.map(g => (
                    <button
                      key={g.id}
                      onClick={() => { setSelected(g); setView('detail') }}
                      className="card rounded-2xl overflow-hidden text-left hover:scale-[1.02] transition-transform"
                    >
                      {g.imageBase64 ? (
                        <img src={g.imageBase64} alt={g.name} className="w-full aspect-square object-cover" />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center bg-white/5 text-5xl">
                          {CATEGORY_EMOJIS[g.category]}
                        </div>
                      )}
                      <div className="p-3">
                        <p className="font-semibold text-white text-sm truncate">{g.name}</p>
                        <p className="text-brand-400 text-sm font-bold mt-0.5">
                          ${g.price.toLocaleString('es-MX')} {g.currency}
                        </p>
                        <p className="text-white/40 text-xs mt-1">{g.sizes.join(' · ')}</p>
                        {!g.available && (
                          <span className="inline-block mt-1 text-xs bg-rose-500/20 text-rose-400 rounded-md px-1.5 py-0.5">
                            Agotado
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADD TAB — photo tips + trigger */}
        {tab === 'add' && (
          <div className="flex flex-col px-5 pb-28 gap-5 overflow-y-auto pt-2">
            <div className="glass rounded-2xl p-5 text-center">
              <div className="text-5xl mb-3">📸</div>
              <h2 className="text-lg font-bold text-white mb-1">Agrega una prenda</h2>
              <p className="text-white/50 text-sm mb-4">
                Toma o sube la foto y llena los datos: talla, precio y cómo comprar.
              </p>
              <button onClick={startAdd} className="btn-primary w-full py-4 rounded-2xl text-base font-bold">
                📷 Tomar / subir foto
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                Tips para mejores fotos
              </p>
              <div className="flex flex-col gap-3">
                {PHOTOGRAPHY_TIPS.map((tip, i) => (
                  <div key={i} className="glass rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-2xl">{tip.emoji}</span>
                    <div>
                      <p className="font-semibold text-white text-sm">{tip.title}</p>
                      <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{tip.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SHARE TAB */}
        {tab === 'share' && (
          <div className="flex flex-col px-5 pb-28 gap-5 overflow-y-auto pt-2">
            {/* Catalog link */}
            <div className="glass rounded-2xl p-5">
              <div className="text-4xl mb-3 text-center">🔗</div>
              <h2 className="text-lg font-bold text-white text-center mb-1">Enlace de catálogo</h2>
              <p className="text-white/50 text-sm text-center mb-4">
                Genera un link y compártelo con tus clientes. No necesitan instalar nada.
              </p>

              {!shareUrl ? (
                <button
                  onClick={() => {
                    if (!profile) { setView('setup'); return }
                    handleCatalogLink()
                  }}
                  disabled={garments.length === 0}
                  className="btn-primary w-full py-4 rounded-2xl text-base font-bold disabled:opacity-40"
                >
                  {garments.length === 0 ? 'Agrega prendas primero' : '✨ Generar enlace'}
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-xs text-white/70 break-all border border-white/10">
                    {shareUrl}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={copyShareUrl} className="flex-1 btn-primary py-3 rounded-xl font-bold text-sm">
                      {copied ? '✅ Copiado' : '📋 Copiar link'}
                    </button>
                    <button
                      onClick={() => navigator.share?.({ url: shareUrl, title: profile?.storeName })}
                      className="flex-1 glass rounded-xl py-3 font-bold text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      📤 Compartir
                    </button>
                  </div>
                  <button
                    onClick={() => setShareUrl(null)}
                    className="text-xs text-white/30 hover:text-white/60 text-center py-1 transition-colors"
                  >
                    Regenerar
                  </button>
                </div>
              )}
            </div>

            {/* WhatsApp per garment */}
            {garments.length > 0 && (
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                  Compartir prenda individual
                </p>
                <div className="flex flex-col gap-2">
                  {garments.filter(g => g.available).map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleShareGarment(g)}
                      className="card rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left w-full"
                    >
                      {g.imageBase64 ? (
                        <img src={g.imageBase64} alt={g.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                          {CATEGORY_EMOJIS[g.category]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{g.name}</p>
                        <p className="text-brand-400 text-xs">${g.price.toLocaleString('es-MX')} {g.currency}</p>
                      </div>
                      <span className="text-white/30 text-lg">📤</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div className="flex flex-col px-5 pb-28 gap-4 overflow-y-auto pt-2">
            {profile ? (
              <>
                <div className="glass rounded-2xl p-5 text-center">
                  <div className="text-5xl mb-3">🏪</div>
                  <h2 className="text-xl font-bold text-white">{profile.storeName}</h2>
                  {profile.ownerName && <p className="text-white/50 text-sm mt-1">👤 {profile.ownerName}</p>}
                  {profile.description && (
                    <p className="text-white/40 text-sm mt-2 leading-relaxed">{profile.description}</p>
                  )}
                </div>

                <div className="glass rounded-2xl p-5 flex flex-col gap-3">
                  {profile.whatsapp && (
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📲</span>
                      <div>
                        <p className="text-xs text-white/40">WhatsApp</p>
                        <p className="text-white text-sm font-medium">+{profile.whatsapp}</p>
                      </div>
                    </div>
                  )}
                  {profile.instagram && (
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📸</span>
                      <div>
                        <p className="text-xs text-white/40">Instagram</p>
                        <p className="text-white text-sm font-medium">@{profile.instagram}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Prendas', value: garments.length },
                    { label: 'Disponibles', value: garments.filter(g => g.available).length },
                    { label: 'Agotadas', value: garments.filter(g => !g.available).length },
                  ].map(s => (
                    <div key={s.label} className="glass rounded-2xl p-4 text-center">
                      <p className="text-2xl font-black text-gradient">{s.value}</p>
                      <p className="text-xs text-white/40 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setView('setup')}
                  className="glass rounded-2xl py-4 text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  ✏️ Editar perfil de tienda
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="text-6xl">🏪</div>
                <h2 className="text-xl font-bold text-white">Configura tu tienda</h2>
                <p className="text-white/40 text-sm max-w-xs">
                  Agrega el nombre, WhatsApp e Instagram para que tus clientes te contacten.
                </p>
                <button onClick={() => setView('setup')} className="btn-primary px-8 py-4 rounded-2xl font-bold">
                  Configurar ahora →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 pb-safe">
        <div className="glass-dark border-t border-white/10 flex items-center px-2 pt-2 pb-3">
          {([
            { key: 'catalog', icon: '🗂️',  label: 'Catálogo' },
            { key: 'add',     icon: null,   label: 'Agregar'  },
            { key: 'share',   icon: '📤',   label: 'Compartir' },
            { key: 'profile', icon: '🏪',   label: 'Mi tienda' },
          ] as { key: Tab; icon: string | null; label: string }[]).map(item => (
            item.key === 'add' ? (
              <button
                key="add"
                onClick={startAdd}
                className="flex-1 flex flex-col items-center gap-0.5"
              >
                <div className="btn-primary w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg -mt-5">
                  +
                </div>
                <span className="text-[10px] text-white/50 mt-1">Agregar</span>
              </button>
            ) : (
              <button
                key={item.key}
                onClick={() => setTab(item.key as Tab)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors ${
                  tab === item.key ? 'text-brand-400' : 'text-white/30 hover:text-white/60'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          ))}
        </div>
      </nav>
    </div>
  )
}

// ─── Setup ────────────────────────────────────────────────────────────────────
function SetupView({
  initial, onSave, onSkip
}: {
  initial: StoreProfile | null
  onSave: (p: StoreProfile) => void
  onSkip?: () => void
}) {
  const [form, setForm] = useState<StoreProfile>(initial ?? {
    storeName: '', ownerName: '', whatsapp: '', instagram: '', description: '',
  })
  const set = (k: keyof StoreProfile, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col px-5 pt-safe">
      <div className="pt-8 pb-5">
        <h1 className="text-3xl font-black text-gradient mb-1">Tu tienda</h1>
        <p className="text-white/50 text-sm">Estos datos aparecen en tu catálogo compartido</p>
      </div>

      <div className="flex-1 flex flex-col gap-4 pb-10">
        <Field label="Nombre de la tienda *" value={form.storeName}
          onChange={v => set('storeName', v)} placeholder="Ej: Boutique Sofía" />
        <Field label="Tu nombre" value={form.ownerName}
          onChange={v => set('ownerName', v)} placeholder="Ej: Sofía Martínez" />
        <Field label="WhatsApp (con código de país)" value={form.whatsapp}
          onChange={v => set('whatsapp', v)} placeholder="521234567890" type="tel" />
        <Field label="Instagram (sin @)" value={form.instagram}
          onChange={v => set('instagram', v)} placeholder="boutiquesofía" />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">Descripción</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Ej: Ropa de moda para mujer. Envíos a todo México."
            rows={3}
            className="glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none resize-none"
          />
        </div>

        <button
          onClick={() => onSave(form)}
          disabled={!form.storeName.trim()}
          className="btn-primary py-4 rounded-2xl text-base font-bold mt-2"
        >
          Guardar →
        </button>
        {onSkip && (
          <button onClick={onSkip} className="text-sm text-white/30 hover:text-white/60 text-center py-2 transition-colors">
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Photo ────────────────────────────────────────────────────────────────────
function PhotoView({ onPhotoReady, onBack }: {
  onPhotoReady: (b64: string) => void
  onBack: () => void
}) {
  const [camActive, setCamActive]   = useState(false)
  const [camError, setCamError]     = useState<string | null>(null)
  const [tipIdx, setTipIdx]         = useState(0)
  const [aiMode, setAiMode]         = useState(false)
  const [aiPrompt, setAiPrompt]     = useState('')
  const [aiUrl, setAiUrl]           = useState<string | null>(null)
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiError, setAiError]       = useState(false)
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCamActive(false)
  }, [])

  const startCamera = useCallback(async () => {
    setCamError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCamActive(true)
    } catch { setCamError('No se pudo acceder a la cámara. Usa la galería.') }
  }, [])

  useEffect(() => () => { stopCamera() }, [stopCamera])

  const capture = () => {
    if (!videoRef.current) return
    const c = document.createElement('canvas')
    c.width = videoRef.current.videoWidth
    c.height = videoRef.current.videoHeight
    c.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    stopCamera()
    onPhotoReady(c.toDataURL('image/jpeg', 0.85))
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onPhotoReady(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const generateAiPhoto = () => {
    if (!aiPrompt.trim()) return
    setAiError(false)
    setAiLoading(true)
    setAiUrl(null)
    const prompt = buildProductPhotoPrompt(aiPrompt, 'clothing', '')
    setAiUrl(buildPollinationsUrl(prompt, { width: 768, height: 1024 }))
  }

  const useAiPhoto = async () => {
    if (!aiUrl) return
    try {
      const res = await fetch(aiUrl)
      const blob = await res.blob()
      const reader = new FileReader()
      reader.onload = ev => onPhotoReady(ev.target?.result as string)
      reader.readAsDataURL(blob)
    } catch { setAiError(true) }
  }

  const tip = PHOTOGRAPHY_TIPS[tipIdx]

  if (aiMode) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        <div className="pt-safe px-5 pt-5 pb-3 flex items-center gap-3">
          <button onClick={() => { setAiMode(false); setAiUrl(null) }} className="text-white/50 hover:text-white text-2xl">←</button>
          <div>
            <h2 className="text-lg font-bold text-white">Generar foto con IA</h2>
            <p className="text-xs text-white/30">Pollinations.AI · Gratis</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-10 flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generateAiPhoto()}
              placeholder="Ej: blusa floral manga corta azul..."
              className="flex-1 glass rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none"
            />
            <button
              onClick={generateAiPhoto}
              disabled={!aiPrompt.trim() || aiLoading}
              className="btn-primary px-5 rounded-2xl font-bold disabled:opacity-40"
            >
              ✨
            </button>
          </div>

          {/* Generated image */}
          {aiUrl && (
            <div className="relative rounded-2xl overflow-hidden">
              {aiLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 gap-3">
                  <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-white/50 text-xs">Generando foto del producto…</p>
                </div>
              )}
              {aiError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                  <div className="text-center px-6">
                    <p className="text-white text-sm mb-3">No se pudo generar</p>
                    <button onClick={generateAiPhoto} className="btn-primary px-4 py-2 rounded-xl text-sm font-bold">Reintentar</button>
                  </div>
                </div>
              )}
              <img
                src={aiUrl}
                alt="Foto generada"
                className="w-full rounded-2xl"
                onLoad={() => setAiLoading(false)}
                onError={() => { setAiLoading(false); setAiError(true) }}
              />
            </div>
          )}

          {!aiUrl && (
            <div className="glass rounded-2xl p-5 text-center text-white/40">
              <div className="text-4xl mb-2">🤖</div>
              <p className="text-sm">Describe la prenda y la IA genera una foto de producto profesional</p>
            </div>
          )}

          {aiUrl && !aiLoading && !aiError && (
            <div className="flex gap-3">
              <button onClick={generateAiPhoto} className="flex-1 glass rounded-2xl py-3 text-sm font-bold text-white/70 hover:text-white transition-colors">
                🔄 Regenerar
              </button>
              <button onClick={useAiPhoto} className="flex-1 btn-primary rounded-2xl py-3 text-sm font-bold">
                ✅ Usar esta foto
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <div className="pt-safe px-5 pt-5 pb-3 flex items-center gap-3">
        <button onClick={() => { stopCamera(); onBack() }} className="text-white/50 hover:text-white text-2xl">←</button>
        <h2 className="text-lg font-bold text-white">Foto de la prenda</h2>
      </div>

      {/* Camera */}
      <div className="mx-5 rounded-2xl overflow-hidden aspect-square bg-black flex items-center justify-center relative">
        <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${camActive ? '' : 'hidden'}`} />
        {!camActive && (
          <div className="flex flex-col items-center gap-2 text-white/30">
            <div className="text-7xl">📷</div>
            <p className="text-sm">Activa cámara o sube foto</p>
          </div>
        )}
        {camError && (
          <div className="absolute bottom-3 left-3 right-3 glass-dark rounded-xl px-3 py-2 text-xs text-rose-400 text-center">
            {camError}
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="mx-5 mt-3 glass rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{tip.emoji}</span>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">{tip.title}</p>
            <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{tip.tip}</p>
          </div>
        </div>
        <div className="flex gap-1.5 mt-3 justify-center">
          {PHOTOGRAPHY_TIPS.map((_, i) => (
            <button key={i} onClick={() => setTipIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === tipIdx ? 'bg-brand-400' : 'bg-white/20'}`} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-safe pb-8 mt-4 flex flex-col gap-3">
        {camActive ? (
          <button onClick={capture} className="btn-primary py-4 rounded-2xl text-base font-bold">📸 Tomar foto</button>
        ) : (
          <button onClick={startCamera} className="btn-primary py-4 rounded-2xl text-base font-bold">📷 Abrir cámara</button>
        )}
        <button onClick={() => fileRef.current?.click()}
          className="glass rounded-2xl py-4 text-base font-bold text-white hover:bg-white/10 transition-colors text-center">
          🖼️ Elegir de galería
        </button>
        <button
          onClick={() => { stopCamera(); setAiMode(true) }}
          className="glass rounded-2xl py-4 text-base font-bold text-accent-400 hover:bg-accent-500/10 transition-colors text-center border border-accent-500/30"
        >
          🤖 Generar foto con IA gratis
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
    </div>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────
function FormView({ photo, draft, profile, onChange, onSave, onRetakePhoto, onBack }: {
  photo: string | null
  draft: Partial<StoreGarment>
  profile: StoreProfile | null
  onChange: (u: Partial<StoreGarment>) => void
  onSave: (g: StoreGarment) => void
  onRetakePhoto: () => void
  onBack: () => void
}) {
  const isValid = !!draft.name?.trim() && (draft.price ?? 0) > 0

  const toggleSize = (s: GarmentSize) => {
    const curr = draft.sizes ?? []
    onChange({ sizes: curr.includes(s) ? curr.filter(x => x !== s) : [...curr, s] })
  }

  const save = () => {
    if (!isValid) return
    const now = new Date().toISOString()
    const pm = (draft.paymentMethod as PaymentMethod) ?? 'whatsapp'
    onSave({
      id: draft.id ?? `g_${Date.now()}`,
      name: draft.name!.trim(),
      description: draft.description ?? '',
      category: (draft.category as Category) ?? 'tops',
      sizes: draft.sizes?.length ? draft.sizes : ['M'],
      colors: draft.colors ?? [],
      price: Number(draft.price) || 0,
      currency: draft.currency ?? 'MXN',
      imageBase64: draft.imageBase64 ?? photo ?? undefined,
      paymentMethod: pm,
      paymentLink: draft.paymentLink ?? (pm === 'whatsapp' ? profile?.whatsapp ?? '' : ''),
      available: draft.available !== false,
      createdAt: draft.createdAt ?? now,
      updatedAt: now,
    })
  }

  const pm = (draft.paymentMethod as PaymentMethod) ?? 'whatsapp'

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <div className="pt-safe px-5 pt-5 pb-3 flex items-center gap-3">
        <button onClick={onBack} className="text-white/50 hover:text-white text-2xl">←</button>
        <h2 className="text-lg font-bold text-white">Detalles de la prenda</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* Photo */}
        <div className="flex items-center gap-3 mb-5">
          {photo ? (
            <img src={photo} alt="prenda" className="w-20 h-20 rounded-xl object-cover border border-white/10" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center text-3xl border border-white/10">
              {CATEGORY_EMOJIS[(draft.category as Category) ?? 'tops']}
            </div>
          )}
          <button onClick={onRetakePhoto} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            {photo ? '🔄 Cambiar foto' : '📷 Agregar foto'}
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <Field label="Nombre de la prenda *" value={draft.name ?? ''}
            onChange={v => onChange({ name: v })} placeholder="Ej: Blusa floral manga corta" />

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">Categoría</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CATEGORY_LABELS) as Category[]).map(c => (
                <button key={c} onClick={() => onChange({ category: c })}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                    draft.category === c
                      ? 'bg-brand-500/20 border border-brand-500/50 text-brand-300'
                      : 'glass text-white/60 hover:text-white'
                  }`}>
                  {CATEGORY_EMOJIS[c]} {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">Descripción</label>
            <textarea value={draft.description ?? ''} onChange={e => onChange({ description: e.target.value })}
              placeholder="Tela, diseño, detalles especiales..." rows={3}
              className="glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none resize-none" />
          </div>

          {/* Sizes */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">Tallas disponibles</label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map(s => (
                <button key={s} onClick={() => toggleSize(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    (draft.sizes ?? []).includes(s) ? 'bg-accent-500 text-white' : 'glass text-white/50 hover:text-white'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">Precio *</label>
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-white/40 text-sm">$</span>
                <input type="number" inputMode="numeric" value={draft.price || ''}
                  onChange={e => onChange({ price: Number(e.target.value) })} placeholder="0"
                  className="flex-1 bg-transparent text-white outline-none text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">Moneda</label>
              <select value={draft.currency ?? 'MXN'} onChange={e => onChange({ currency: e.target.value as 'MXN' | 'USD' })}
                className="glass rounded-xl px-4 py-3 text-sm text-white outline-none bg-transparent">
                <option value="MXN" className="bg-gray-900">MXN</option>
                <option value="USD" className="bg-gray-900">USD</option>
              </select>
            </div>
          </div>

          {/* Payment */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">Forma de compra</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['whatsapp',   '📲 WhatsApp'],
                ['mercadopago','💳 MercadoPago'],
                ['tienda',     '🛒 Tienda online'],
                ['efectivo',   '💵 Solo efectivo'],
              ] as [PaymentMethod, string][]).map(([val, label]) => (
                <button key={val} onClick={() => onChange({ paymentMethod: val })}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    pm === val ? 'bg-brand-500/20 border border-brand-500/50 text-brand-300' : 'glass text-white/60 hover:text-white'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            {pm !== 'efectivo' && (
              <Field
                label={pm === 'whatsapp' ? 'Número WhatsApp' : pm === 'mercadopago' ? 'Link de MercadoPago' : 'URL de la tienda'}
                value={draft.paymentLink ?? (pm === 'whatsapp' ? profile?.whatsapp ?? '' : '')}
                onChange={v => onChange({ paymentLink: v })}
                placeholder={pm === 'whatsapp' ? '521234567890' : 'https://...'}
                type={pm === 'whatsapp' ? 'tel' : 'url'}
              />
            )}
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between glass rounded-xl px-4 py-3">
            <span className="text-sm text-white font-medium">Disponible para venta</span>
            <button onClick={() => onChange({ available: !draft.available })}
              className={`w-12 h-6 rounded-full transition-colors relative ${draft.available !== false ? 'bg-brand-500' : 'bg-white/20'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${draft.available !== false ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-5 pb-safe pb-6 pt-4 bg-gradient-to-t from-[#030712] to-transparent">
        <button onClick={save} disabled={!isValid} className="btn-primary w-full py-4 rounded-2xl text-base font-bold">
          ✅ Guardar en catálogo
        </button>
      </div>
    </div>
  )
}

// ─── Detail ───────────────────────────────────────────────────────────────────
function DetailView({ garment, profile, onBack, onShare, onEdit, onDelete }: {
  garment: StoreGarment
  profile: StoreProfile | null
  onBack: () => void
  onShare: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const buyAction = () => {
    if (garment.paymentMethod === 'whatsapp') {
      const text = buildGarmentShareText(garment, profile)
      window.open(buildWhatsAppLink(garment.paymentLink, `Hola! Me interesa:\n${text}`), '_blank')
    } else if (garment.paymentLink) {
      window.open(garment.paymentLink, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <div className="pt-safe px-5 pt-5 pb-2 flex items-center justify-between">
        <button onClick={onBack} className="text-white/50 hover:text-white text-2xl">←</button>
        <div className="flex gap-2">
          <button onClick={onShare} className="glass rounded-xl px-3 py-2 text-xs font-semibold text-brand-400">📤 Compartir</button>
          <button onClick={onEdit}  className="glass rounded-xl px-3 py-2 text-xs font-semibold text-white/60">✏️ Editar</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {garment.imageBase64 ? (
          <img src={garment.imageBase64} alt={garment.name} className="w-full max-h-80 object-cover" />
        ) : (
          <div className="w-full aspect-video flex items-center justify-center text-8xl bg-white/5">
            {CATEGORY_EMOJIS[garment.category]}
          </div>
        )}

        <div className="px-5 mt-4 flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{garment.name}</h2>
            <p className="text-brand-400 text-xl font-bold mt-1">${garment.price.toLocaleString('es-MX')} {garment.currency}</p>
            {!garment.available && (
              <span className="inline-block mt-1 text-sm bg-rose-500/20 text-rose-400 rounded-lg px-2 py-0.5">Agotado</span>
            )}
          </div>

          <div className="glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Categoría</span>
              <span className="text-white font-medium">{CATEGORY_EMOJIS[garment.category]} {CATEGORY_LABELS[garment.category]}</span>
            </div>
            <div className="flex justify-between text-sm items-start">
              <span className="text-white/40">Tallas</span>
              <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                {garment.sizes.map(s => (
                  <span key={s} className="bg-accent-500/20 text-accent-400 rounded-lg px-2 py-0.5 text-xs font-bold">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {garment.description && (
            <p className="text-white/70 text-sm leading-relaxed">{garment.description}</p>
          )}

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="text-rose-400/50 hover:text-rose-400 text-sm text-center py-2 transition-colors">
              🗑️ Eliminar prenda
            </button>
          ) : (
            <div className="glass rounded-2xl p-4 border border-rose-500/30">
              <p className="text-white text-sm text-center mb-3">¿Eliminar esta prenda?</p>
              <div className="flex gap-2">
                <button onClick={onDelete} className="flex-1 bg-rose-500 text-white rounded-xl py-2 text-sm font-bold">Sí, eliminar</button>
                <button onClick={() => setConfirmDelete(false)} className="flex-1 glass text-white/60 rounded-xl py-2 text-sm">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {garment.paymentMethod !== 'efectivo' && garment.paymentLink && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-safe pb-6 pt-4 bg-gradient-to-t from-[#030712] to-transparent">
          <button onClick={buyAction} className="btn-primary w-full py-4 rounded-2xl text-base font-bold">
            {garment.paymentMethod === 'whatsapp'    && '📲 Contactar por WhatsApp'}
            {garment.paymentMethod === 'mercadopago' && '💳 Pagar con MercadoPago'}
            {garment.paymentMethod === 'tienda'      && '🛒 Ver en tienda online'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" />
    </div>
  )
}
