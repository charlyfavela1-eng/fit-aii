export type GarmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
export type PersonSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export interface Garment {
  id: string
  name: string
  brand: string
  size: GarmentSize
  color: string
  colorHex: string
  type: string
  category: 'tops' | 'outerwear' | 'dresses' | 'bottoms'
  description: string
  price: number
  emoji: string
  measurements: {
    chest?: number
    waist?: number
    hips?: number
    length?: number
  }
  tags: string[]
}

export const catalog: Garment[] = [
  {
    id: 'hoodie-001',
    name: 'Cloud Hoodie',
    brand: 'FitAI Studio',
    size: 'M',
    color: 'Negro Carbón',
    colorHex: '#1a1a1a',
    type: 'hoodie',
    category: 'tops',
    description: 'Hoodie oversized de algodón orgánico 420gsm con interior afelpado',
    price: 1290,
    emoji: '🖤',
    measurements: { chest: 108, waist: 104, hips: 110, length: 70 },
    tags: ['oversized', 'algodón', 'unisex'],
  },
  {
    id: 'tshirt-001',
    name: 'Essential Tee',
    brand: 'FitAI Studio',
    size: 'L',
    color: 'Blanco Óptico',
    colorHex: '#fafafa',
    type: 'camiseta',
    category: 'tops',
    description: 'Camiseta básica manga corta de algodón pima 180gsm',
    price: 490,
    emoji: '🤍',
    measurements: { chest: 112, waist: 108, length: 74 },
    tags: ['básico', 'algodón', 'unisex'],
  },
  {
    id: 'jacket-001',
    name: 'Moto Jacket',
    brand: 'FitAI Studio',
    size: 'S',
    color: 'Café Cognac',
    colorHex: '#8B4513',
    type: 'chamarra',
    category: 'outerwear',
    description: 'Chamarra estilo moto de piel sintética con forro de satén',
    price: 2490,
    emoji: '🤎',
    measurements: { chest: 98, waist: 94, length: 62 },
    tags: ['piel sintética', 'moto', 'clásico'],
  },
  {
    id: 'dress-001',
    name: 'Linen Midi Dress',
    brand: 'FitAI Studio',
    size: 'XS',
    color: 'Azul Cielo',
    colorHex: '#87CEEB',
    type: 'vestido',
    category: 'dresses',
    description: 'Vestido midi de lino con bordado floral en el escote',
    price: 1890,
    emoji: '💙',
    measurements: { chest: 84, waist: 68, hips: 90, length: 95 },
    tags: ['lino', 'verano', 'floral'],
  },
  {
    id: 'blazer-001',
    name: 'Power Blazer',
    brand: 'FitAI Studio',
    size: 'XL',
    color: 'Beige Arena',
    colorHex: '#D2B48C',
    type: 'blazer',
    category: 'outerwear',
    description: 'Blazer oversize de mezcla de lana con hombreras sutiles',
    price: 2190,
    emoji: '🤍',
    measurements: { chest: 120, waist: 116, length: 78 },
    tags: ['formal', 'oversize', 'lana'],
  },
  {
    id: 'tshirt-002',
    name: 'Vintage Crop',
    brand: 'FitAI Studio',
    size: 'XXL',
    color: 'Verde Oliva',
    colorHex: '#6B7C3C',
    type: 'camiseta cropped',
    category: 'tops',
    description: 'Camiseta cropped estilo vintage con lavado especial',
    price: 590,
    emoji: '💚',
    measurements: { chest: 128, waist: 124, length: 54 },
    tags: ['crop', 'vintage', 'lavado'],
  },
]

const sizeOrder: GarmentSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function getSizeDiff(garmentSize: GarmentSize, personSize: PersonSize): number {
  return sizeOrder.indexOf(garmentSize) - sizeOrder.indexOf(personSize)
}

export function getFitLabel(diff: number): string {
  if (diff === 0) return 'Talla perfecta'
  if (diff === 1) return 'Ligeramente grande'
  if (diff === 2) return 'Grande (holgada)'
  if (diff >= 3) return 'Muy grande (oversized)'
  if (diff === -1) return 'Ligeramente ajustada'
  if (diff === -2) return 'Pequeña (apretada)'
  return 'Muy pequeña'
}

export function getFitDescription(diff: number): string {
  if (diff === 0) return 'te quedará perfectamente a tu medida'
  if (diff === 1) return 'estará ligeramente holgada, con un look relajado'
  if (diff === 2) return 'se verá notablemente grande, hombros caídos y mangas largas'
  if (diff >= 3) return 'estará muy grande, estilo oversized extremo'
  if (diff === -1) return 'estará ligeramente ajustada, marcando la silueta'
  if (diff === -2) return 'estará apretada, con la tela tensionada'
  return 'estará muy pequeña, considerablemente apretada'
}

export function getFitColor(diff: number): string {
  if (diff === 0) return 'green'
  if (Math.abs(diff) === 1) return 'yellow'
  return 'red'
}

export function buildTryOnPrompt(garment: Garment, personSize: PersonSize): string {
  const diff = getSizeDiff(garment.size, personSize)
  const fitDesc = getFitDescription(diff)

  let fitModifiers = ''
  if (diff >= 2) {
    fitModifiers = 'The garment is clearly oversized: shoulders drooping past the arms, sleeves much too long, excess fabric bunching at the waist, very relaxed silhouette.'
  } else if (diff === 1) {
    fitModifiers = 'The garment is slightly large: slightly loose shoulders, relaxed fit with a little extra fabric.'
  } else if (diff === -1) {
    fitModifiers = 'The garment is slightly small: slightly tight across the chest, fabric pulling at seams.'
  } else if (diff <= -2) {
    fitModifiers = 'The garment is clearly too small: very tight, fabric stretched across chest and shoulders, visibly undersized.'
  }

  return [
    `High-quality fashion photograph of a person wearing a ${garment.color} ${garment.type} called "${garment.name}".`,
    `The garment is size ${garment.size} but the person wears size ${personSize}, so it ${fitDesc}.`,
    fitModifiers,
    'Full body shot, studio lighting, white background, fashion catalog style, photorealistic, 4K quality.',
    'The clothing details, texture, color, and stitching should be clearly visible.',
  ].filter(Boolean).join(' ')
}
