export type GarmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
export type PersonSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export interface Garment {
  id: string
  name: string
  brand: string
  size: GarmentSize
  color: string
  type: string
  description: string
  imageUrl: string
  measurements: {
    chest?: number
    waist?: number
    hips?: number
    length?: number
  }
}

export const catalog: Garment[] = [
  {
    id: 'hoodie-001',
    name: 'Urban Hoodie',
    brand: 'FitAI Studio',
    size: 'M',
    color: 'Negro',
    type: 'hoodie',
    description: 'Hoodie oversized de algodón premium',
    imageUrl: '/catalog/hoodie-black.jpg',
    measurements: { chest: 108, waist: 104, hips: 110, length: 70 },
  },
  {
    id: 'tshirt-001',
    name: 'Classic Tee',
    brand: 'FitAI Studio',
    size: 'L',
    color: 'Blanco',
    type: 'camiseta',
    description: 'Camiseta básica manga corta',
    imageUrl: '/catalog/tshirt-white.jpg',
    measurements: { chest: 112, waist: 108, length: 74 },
  },
  {
    id: 'jacket-001',
    name: 'Moto Jacket',
    brand: 'FitAI Studio',
    size: 'S',
    color: 'Café',
    type: 'chamarra',
    description: 'Chamarra estilo moto de piel sintética',
    imageUrl: '/catalog/jacket-brown.jpg',
    measurements: { chest: 98, waist: 94, length: 62 },
  },
  {
    id: 'dress-001',
    name: 'Summer Dress',
    brand: 'FitAI Studio',
    size: 'XS',
    color: 'Azul',
    type: 'vestido',
    description: 'Vestido floral de verano',
    imageUrl: '/catalog/dress-blue.jpg',
    measurements: { chest: 84, waist: 68, hips: 90, length: 95 },
  },
]

const sizeOrder: GarmentSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function getSizeDiff(garmentSize: GarmentSize, personSize: PersonSize): number {
  return sizeOrder.indexOf(garmentSize) - sizeOrder.indexOf(personSize)
}

export function getFitDescription(diff: number): string {
  if (diff === 0) return 'ajustada perfectamente'
  if (diff === 1) return 'ligeramente holgada'
  if (diff === 2) return 'notablemente grande, mangas largas y hombros caídos'
  if (diff >= 3) return 'muy grande, estilo oversized extremo, hombros muy caídos'
  if (diff === -1) return 'ligeramente ajustada'
  if (diff === -2) return 'notablemente apretada, marcando el cuerpo'
  return 'muy ajustada y apretada'
}

export function buildTryOnPrompt(
  garment: Garment,
  personSize: PersonSize,
  additionalDetails: string = ''
): string {
  const diff = getSizeDiff(garment.size, personSize)
  const fitDesc = getFitDescription(diff)

  const basePrompt = `Professional fashion photo. Person wearing a ${garment.color} ${garment.type} called "${garment.name}" size ${garment.size}. The person appears to be size ${personSize}. The garment fits ${fitDesc} on them.`

  const fitModifiers = diff >= 2
    ? ' Shoulders drooping, sleeves too long, fabric bunching. Clearly too big.'
    : diff <= -2
    ? ' Fabric stretched tight, clearly too small.'
    : ''

  return `${basePrompt}${fitModifiers} High quality, realistic, fashion catalog style, full body shot. ${additionalDetails}`.trim()
}
