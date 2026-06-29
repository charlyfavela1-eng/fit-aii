export interface SavedItem {
  id: string
  name: string
  brand: string
  image: string
  price: string
  priceNum: number
  buyUrl: string
  source: string
  gender: 'mujer' | 'hombre' | 'mama' | 'unisex'
  addedAt: number
}

const KEY = 'fitai_my_catalog'

export function getSavedItems(): SavedItem[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') }
  catch { return [] }
}

export function saveItem(item: Omit<SavedItem, 'addedAt'>): void {
  const items = getSavedItems()
  if (items.find(i => i.id === item.id)) return
  items.unshift({ ...item, addedAt: Date.now() })
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 100)))
}

export function removeItem(id: string): void {
  const items = getSavedItems().filter(i => i.id !== id)
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function isItemSaved(id: string): boolean {
  return getSavedItems().some(i => i.id === id)
}
