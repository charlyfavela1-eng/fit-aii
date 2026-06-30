export type GarmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Único'
export type Category = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'accessories' | 'shoes' | 'other'
export type PaymentMethod = 'whatsapp' | 'mercadopago' | 'tienda' | 'efectivo'
export type Currency = 'MXN' | 'USD'

export interface StoreGarment {
  id: string
  name: string
  description: string
  category: Category
  sizes: GarmentSize[]
  colors: string[]
  price: number
  currency: Currency
  imageBase64?: string
  paymentMethod: PaymentMethod
  paymentLink: string
  available: boolean
  createdAt: string
  updatedAt: string
}

export interface StoreProfile {
  storeName: string
  ownerName: string
  whatsapp: string
  instagram: string
  description: string
}

const STORAGE_KEY = 'fitai_store_catalog'
const PROFILE_KEY = 'fitai_store_profile'

export function getStoreGarments(): StoreGarment[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveStoreGarment(garment: StoreGarment): void {
  const list = getStoreGarments()
  const idx = list.findIndex(g => g.id === garment.id)
  if (idx >= 0) list[idx] = { ...garment, updatedAt: new Date().toISOString() }
  else list.unshift(garment)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function deleteStoreGarment(id: string): void {
  const list = getStoreGarments().filter(g => g.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getStoreProfile(): StoreProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveStoreProfile(profile: StoreProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function newGarmentDraft(): Partial<StoreGarment> {
  return {
    id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    description: '',
    category: 'tops',
    sizes: ['M'],
    colors: [],
    price: 0,
    currency: 'MXN',
    paymentMethod: 'whatsapp',
    paymentLink: '',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export const CATEGORY_LABELS: Record<Category, string> = {
  tops: 'Blusas / Tops',
  bottoms: 'Pantalones / Faldas',
  dresses: 'Vestidos',
  outerwear: 'Chamarras / Abrigos',
  accessories: 'Accesorios',
  shoes: 'Zapatos',
  other: 'Otro',
}

export const CATEGORY_EMOJIS: Record<Category, string> = {
  tops: '👚', bottoms: '👖', dresses: '👗', outerwear: '🧥',
  accessories: '👜', shoes: '👠', other: '🛍️',
}

export const SIZE_OPTIONS: GarmentSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Único']

export const PHOTOGRAPHY_TIPS = [
  {
    emoji: '☀️',
    title: 'Luz natural',
    tip: 'Toma la foto junto a una ventana con luz del día. Evita el flash directo — aplana los colores.',
  },
  {
    emoji: '🤍',
    title: 'Fondo limpio',
    tip: 'Usa pared blanca, sabana clara o cartulina. Un fondo neutro hace que la prenda sea la protagonista.',
  },
  {
    emoji: '👗',
    title: 'Prenda impecable',
    tip: 'Plancha o vapea antes de fotografiar. Sin arrugas, la prenda luce como nueva y de más valor.',
  },
  {
    emoji: '📐',
    title: 'Ángulo frontal',
    tip: 'Centra la prenda y fotografía de frente. Un gancho o percha ayuda a que se vea la forma completa.',
  },
  {
    emoji: '🔍',
    title: 'Captura detalles',
    tip: 'Toma una foto de cerca de bordados, botones, textura o acabado especial que justifique el precio.',
  },
  {
    emoji: '📏',
    title: 'Muestra el tamaño',
    tip: 'Si puedes, include una foto de la prenda puesta para que la clienta imagine cómo le queda.',
  },
]

export interface CatalogShareItem {
  id: string
  n: string   // name
  d: string   // description
  c: string   // category
  s: string[] // sizes
  p: number   // price
  cu: string  // currency
  pm: string  // paymentMethod
  pl: string  // paymentLink
}

export interface CatalogShareData {
  n: string             // storeName
  w: string             // whatsapp
  i: string             // instagram
  d: string             // description
  g: CatalogShareItem[] // garments
}

export function encodeCatalogLink(profile: StoreProfile, garments: StoreGarment[]): string {
  const data: CatalogShareData = {
    n: profile.storeName,
    w: profile.whatsapp,
    i: profile.instagram,
    d: profile.description,
    g: garments
      .filter(g => g.available)
      .map(g => ({
        id: g.id,
        n: g.name,
        d: g.description,
        c: g.category,
        s: g.sizes,
        p: g.price,
        cu: g.currency,
        pm: g.paymentMethod,
        pl: g.paymentLink,
      })),
  }
  return btoa(encodeURIComponent(JSON.stringify(data)))
}

export function decodeCatalogLink(slug: string): CatalogShareData | null {
  try {
    const json = decodeURIComponent(atob(slug))
    return JSON.parse(json)
  } catch { return null }
}

export function buildGarmentShareText(garment: StoreGarment, profile?: StoreProfile | null): string {
  const lines: string[] = [
    `🛍️ *${garment.name}*`,
    `💰 $${garment.price.toLocaleString('es-MX')} ${garment.currency}`,
    `📏 Tallas: ${garment.sizes.join(', ')}`,
    garment.category !== 'other' ? `🏷️ ${CATEGORY_LABELS[garment.category]}` : '',
  ].filter(Boolean)

  if (garment.description) lines.push(`\n${garment.description}`)
  if (profile?.storeName) lines.push(`\n📍 ${profile.storeName}`)

  if (garment.paymentMethod === 'whatsapp' && garment.paymentLink) {
    lines.push(`\n📲 Pedir por WhatsApp: wa.me/${garment.paymentLink.replace(/\D/g, '')}`)
  } else if (garment.paymentMethod === 'mercadopago' && garment.paymentLink) {
    lines.push(`\n💳 Pagar con MercadoPago: ${garment.paymentLink}`)
  } else if (garment.paymentMethod === 'tienda' && garment.paymentLink) {
    lines.push(`\n🛒 Ver en tienda: ${garment.paymentLink}`)
  } else if (garment.paymentMethod === 'efectivo') {
    lines.push(`\n💵 Pago en efectivo`)
  }

  return lines.join('\n')
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}
