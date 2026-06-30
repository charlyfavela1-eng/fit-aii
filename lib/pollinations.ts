export interface PollinationsOptions {
  model?: string
  width?: number
  height?: number
  seed?: number
  enhance?: boolean
  imageUrl?: string  // for kontext img2img (must be a public URL)
}

export function buildPollinationsUrl(prompt: string, opts: PollinationsOptions = {}): string {
  const {
    model = 'flux',
    width = 768,
    height = 1024,
    seed = Math.floor(Math.random() * 99999),
    enhance = true,
    imageUrl,
  } = opts

  const params = new URLSearchParams({
    model,
    width: String(width),
    height: String(height),
    seed: String(seed),
    nologo: 'true',
    enhance: String(enhance),
  })

  if (imageUrl) {
    params.set('image', imageUrl)
  }

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`
}

export const OUTFIT_EXAMPLES = [
  { label: '👗 Vestido floral', prompt: 'fashion photo, woman wearing floral summer dress, white studio background, full body, elegant lighting, high quality' },
  { label: '👔 Traje formal', prompt: 'fashion photo, man wearing formal business suit, white studio background, full body, professional lighting, high quality' },
  { label: '🧥 Look urbano', prompt: 'fashion photo, woman wearing stylish urban streetwear outfit, white studio background, full body, trendy, high quality' },
  { label: '👖 Casual chic', prompt: 'fashion photo, woman wearing casual chic jeans and blouse, white studio background, full body, natural lighting, high quality' },
  { label: '🎽 Deportivo', prompt: 'fashion photo, person wearing modern athletic sportswear, white studio background, full body, bright lighting, high quality' },
  { label: '🌙 Look noche', prompt: 'fashion photo, woman wearing elegant night out dress, dark studio background, full body, dramatic lighting, high quality' },
]

export function buildProductPhotoPrompt(garmentName: string, category: string, description?: string): string {
  const base = `professional product photo, ${garmentName}, ${category} clothing item, clean white background, flat lay or hanging, studio lighting, high quality, e-commerce style`
  return description ? `${base}, ${description}` : base
}
