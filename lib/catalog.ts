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
  visualDescription?: string
  price: number
  emoji: string
  image?: string
  buyUrl?: string
  measurements: {
    chest?: number
    waist?: number
    hips?: number
    length?: number
  }
  tags: string[]
}

// ── CATÁLOGO MAMÁ — TEMU ──────────────────────────────────────────────────────
export const catalogMama: Garment[] = [
  {
    id: 'mama-temu-blusa-floral-1',
    name: 'Blusa Floral Manga Larga',
    brand: 'Temu',
    size: 'L',
    color: 'Floral Multicolor',
    colorHex: '#C27BA0',
    type: 'blusa floral',
    category: 'tops',
    description: 'Blusa floral ligera con manga larga — fresca, femenina y muy cómoda para el día a día.',
    visualDescription: 'colorful floral print blouse with long sleeves, lightweight fabric, relaxed feminine fit, V-neckline, vibrant multicolor floral pattern on white or light background',
    price: 189,
    emoji: '🌸',
    image: 'https://img.kwcdn.com/product/fancy/84a90428-227b-4232-aa49-632d9f5c7f5f.jpg',
    buyUrl: 'https://share.temu.com/IPjgOsqt2DA',
    measurements: { chest: 108, waist: 104, length: 68 },
    tags: ['mama', 'blusa', 'floral', 'casual', 'temu', 'comodo'],
  },
  {
    id: 'mama-temu-conjunto-casual-2',
    name: 'Conjunto Dos Piezas Casual',
    brand: 'Temu',
    size: 'L',
    color: 'Rosa/Lila',
    colorHex: '#C3A0C8',
    type: 'conjunto casual',
    category: 'tops',
    description: 'Conjunto de dos piezas suave y cómodo — perfecto para estar en casa o salir a hacer mandados con estilo.',
    visualDescription: 'matching two-piece casual set, soft knit fabric, relaxed comfortable fit, light purple or rose color, loungewear style but presentable, elastic waist pants with matching top',
    price: 249,
    emoji: '💜',
    image: 'https://img.kwcdn.com/product/fancy/40344c1b-a518-42bb-b7bd-51cf84a61fdb.jpg',
    buyUrl: 'https://share.temu.com/nqRQn0cakgA',
    measurements: { chest: 110, waist: 106, length: 65 },
    tags: ['mama', 'conjunto', 'casual', 'temu', 'comodo', 'viral'],
  },
  {
    id: 'mama-temu-vestido-floral-midi',
    name: 'Vestido Floral Verano',
    brand: 'Temu',
    size: 'L',
    color: 'Floral Azul',
    colorHex: '#6BA3C8',
    type: 'vestido casual',
    category: 'dresses',
    description: 'Vestido floral de verano con silueta suelta — fresco, femenino y perfecto para salidas familiares.',
    visualDescription: 'casual floral summer dress, blue floral print on white base, loose relaxed silhouette, short sleeves, round neckline, midi length, lightweight chiffon-like fabric with gentle drape',
    price: 219,
    emoji: '🌼',
    buyUrl: 'https://www.temu.com/search_result.html?search_key=vestido+floral+mama&search_method=user',
    measurements: { chest: 108, waist: 104, hips: 114, length: 110 },
    tags: ['mama', 'vestido', 'floral', 'casual', 'temu', 'comodo'],
  },
  {
    id: 'mama-temu-blusa-bordada',
    name: 'Blusa Bordada Festiva',
    brand: 'Temu',
    size: 'XL',
    color: 'Blanco con bordado',
    colorHex: '#F5F0EB',
    type: 'blusa bordada',
    category: 'tops',
    description: 'Blusa blanca con bordado colorido — el toque especial para reuniones familiares y celebraciones.',
    visualDescription: 'white blouse with colorful embroidery details on neckline and sleeves, peasant style, flowy fabric, feminine and festive look, comfortable relaxed fit, short puffed sleeves',
    price: 199,
    emoji: '🪡',
    buyUrl: 'https://www.temu.com/search_result.html?search_key=blusa+bordada+mujer&search_method=user',
    measurements: { chest: 118, waist: 114, length: 66 },
    tags: ['mama', 'blusa', 'bordada', 'elegante', 'temu', 'fiesta'],
  },
  {
    id: 'mama-temu-cardigan-suave',
    name: 'Cárdigan Suave de Punto',
    brand: 'Temu',
    size: 'XL',
    color: 'Beige/Crema',
    colorHex: '#D9C9B0',
    type: 'cárdigan punto',
    category: 'outerwear',
    description: 'Cárdigan de punto suave y abrigador — el básico perfecto para salir con estilo en días frescos.',
    visualDescription: 'soft knit cardigan in cream beige color, open front with no buttons, relaxed oversized fit, long sleeves, cozy and warm, elegant casual style, ribbed texture knit',
    price: 279,
    emoji: '🧶',
    buyUrl: 'https://www.temu.com/search_result.html?search_key=cardigan+suave+mujer&search_method=user',
    measurements: { chest: 120, waist: 116, length: 80 },
    tags: ['mama', 'cardigan', 'casual', 'temu', 'comodo', 'abrigo'],
  },
  {
    id: 'mama-temu-pantalon-confort',
    name: 'Pantalón Confort Elástico',
    brand: 'Temu',
    size: 'XL',
    color: 'Negro',
    colorHex: '#1a1a1a',
    type: 'pantalón elástico',
    category: 'bottoms',
    description: 'Pantalón con cintura elástica — cómodo todo el día, ideal para combinar con cualquier blusa.',
    visualDescription: 'black elastic waist comfort pants, straight leg fit, soft stretch fabric, relaxed everyday style, no pockets visible, clean minimal design, mid-rise waistband',
    price: 159,
    emoji: '🖤',
    buyUrl: 'https://www.temu.com/search_result.html?search_key=pantalon+elastico+mujer&search_method=user',
    measurements: { chest: 102, waist: 110, hips: 118, length: 98 },
    tags: ['mama', 'pantalon', 'casual', 'temu', 'comodo', 'negro'],
  },
  {
    id: 'mama-temu-blusa-rayas-suelta',
    name: 'Blusa Suelta a Rayas',
    brand: 'Temu',
    size: 'L',
    color: 'Rayas Multicolor',
    colorHex: '#B0A8D4',
    type: 'blusa suelta',
    category: 'tops',
    description: 'Blusa suelta a rayas de tela ligera — fresca, holgada y perfecta para el calor.',
    visualDescription: 'loose-fit striped women blouse, colorful horizontal stripes in soft tones, V-neckline, relaxed silhouette, lightweight breathable fabric, casual everyday style, flowy and comfortable',
    price: 140,
    emoji: '🌈',
    image: 'https://img.kwcdn.com/product/fancy/c10edb33-ba58-404c-83ab-91b063313400.jpg',
    buyUrl: 'https://www.temu.com/mx/blusas-de-solapa-suelta-con-cuello-en-v-blusas-de-moda-de-manga-larga-con-botones-de-patron-casual-ropa-de-mujer-g-601099512866266.html',
    measurements: { chest: 110, waist: 106, length: 66 },
    tags: ['mama', 'blusa', 'rayas', 'casual', 'temu', 'comodo', 'fresco'],
  },
  {
    id: 'mama-temu-blusa-lazo-corta',
    name: 'Blusa Manga Corta con Lazo',
    brand: 'Temu',
    size: 'L',
    color: 'Rosa Suave',
    colorHex: '#F2B5C8',
    type: 'blusa con lazo',
    category: 'tops',
    description: 'Blusa manga corta con detalle de lazo en el cuello — femenina, ligera y muy favorecedora.',
    visualDescription: 'short sleeve women blouse with tie bow at neckline, soft pink color, relaxed fit, feminine casual style, lightweight fabric, ruched or gathered details, comfortable everyday wear',
    price: 149,
    emoji: '🎀',
    image: 'https://img.kwcdn.com/product/fancy/fbf7e2e3-b5a6-4a74-b35b-c3d664a15c89.jpg',
    buyUrl: 'https://www.temu.com/mx/blusa--casual-para-mujer-con-cuello--y--de-cordon-color--manga-corta-versatil-y-elegante-para-atuendos-informales-blusas-de-mujer-g-601099837016641.html',
    measurements: { chest: 108, waist: 104, length: 64 },
    tags: ['mama', 'blusa', 'lazo', 'casual', 'temu', 'comodo', 'femenina'],
  },
  {
    id: 'mama-temu-top-bordado-retro',
    name: 'Top Bordado Floral Retro',
    brand: 'Temu',
    size: 'L',
    color: 'Crema con Bordado',
    colorHex: '#EDE0C8',
    type: 'top bordado',
    category: 'tops',
    description: 'Top de manga larga con bordado floral retro — elegante y artesanal, ideal para salidas especiales.',
    visualDescription: 'long sleeve women top with retro floral embroidery, cream or off-white base color, round neckline, colorful floral stitching pattern across chest and sleeves, vintage folk style, relaxed comfortable fit',
    price: 365,
    emoji: '🌺',
    image: 'https://img.kwcdn.com/product/fancy/48d8eb12-f96a-4715-9270-76b17f219e73.jpg',
    buyUrl: 'https://www.temu.com/mx/retro-bordado-floral-patron--cuello--casual-suelta-camiseta-de--larga-para-mujer-g-601100678168792.html',
    measurements: { chest: 112, waist: 108, length: 68 },
    tags: ['mama', 'top', 'bordado', 'retro', 'temu', 'elegante', 'floral'],
  },
  {
    id: 'mama-temu-camiseta-etnica-vintage',
    name: 'Camiseta Étnica Vintage',
    brand: 'Temu',
    size: 'L',
    color: 'Multicolor Étnico',
    colorHex: '#C47A3A',
    type: 'camiseta étnica',
    category: 'tops',
    description: 'Camiseta con estampado étnico tribal y detalle de encaje — estilo bohemio con mucho carácter.',
    visualDescription: 'women vintage ethnic tribal print t-shirt, colorful geometric and floral pattern in earth tones, round neckline with lace trim detail, short sleeves, relaxed fit, bohemian casual style',
    price: 240,
    emoji: '🏺',
    image: 'https://img.kwcdn.com/product/fancy/f3e8f841-9712-412a-a1bf-8c256bf3e06d.jpg',
    buyUrl: 'https://www.temu.com/mx/camiseta-elegante-vintage-de-mujer-con-estampado--tribal-cuello--y-detalles-de-encaje-manga-corta-casual-para--verano-g-601101340932977.html',
    measurements: { chest: 108, waist: 104, length: 66 },
    tags: ['mama', 'camiseta', 'etnica', 'vintage', 'temu', 'bohemio'],
  },
  {
    id: 'mama-temu-vestido-floral-cinturon',
    name: 'Vestido Floral con Cinturón',
    brand: 'Temu',
    size: 'L',
    color: 'Floral Rosado',
    colorHex: '#E8A0B4',
    type: 'vestido floral',
    category: 'dresses',
    description: 'Vestido floral con cinturón incluido — silueta favorecedora que marca la cintura sin esfuerzo.',
    visualDescription: 'floral print women dress with matching belt at waist, pink and multicolor flower pattern, V-neckline, short sleeves, fitted waist with flared A-line skirt, midi length, feminine everyday style',
    price: 151,
    emoji: '💐',
    image: 'https://img.kwcdn.com/local-goods-image-g/20237f6142/03d1eb30-2a46-4227-bf82-bc4961856b4d_1340x1787.jpeg.format.jpg',
    buyUrl: 'https://www.temu.com/mx/vestidos-de-mujer-5020302605906-s.html',
    measurements: { chest: 106, waist: 100, hips: 112, length: 108 },
    tags: ['mama', 'vestido', 'floral', 'cinturon', 'temu', 'comodo', 'casual'],
  },
  {
    id: 'mama-temu-vestido-tirantes-floral',
    name: 'Vestido Tirantes Floral Verano',
    brand: 'Temu',
    size: 'L',
    color: 'Floral Verano',
    colorHex: '#7BBFB0',
    type: 'vestido tirantes',
    category: 'dresses',
    description: 'Vestido de tirantes con volantes y estampado floral — el favorito para días de calor y paseos.',
    visualDescription: 'floral print spaghetti strap women summer dress, ruffled hem detail, vibrant multicolor floral pattern, loose flowing silhouette, lightweight fabric, vacation casual style, midi or mini length',
    price: 203,
    emoji: '🌻',
    image: 'https://img.kwcdn.com/product/open/356f984e17e84fc48fc524ed38426bdc-goods.jpeg',
    buyUrl: 'https://www.temu.com/mx/vestido--con-estampado-floral-vestido-de-tirantes-con-volantes-para-vacaciones-ropa-de-mujer-g-601099520198940.html',
    measurements: { chest: 106, waist: 102, hips: 114, length: 105 },
    tags: ['mama', 'vestido', 'tirantes', 'floral', 'temu', 'verano', 'comodo'],
  },
  {
    id: 'mama-temu-vestido-maxi-suelto',
    name: 'Vestido Maxi Suelto Literario',
    brand: 'Temu',
    size: 'XL',
    color: 'Lila Suave',
    colorHex: '#C5B8D8',
    type: 'vestido maxi',
    category: 'dresses',
    description: 'Vestido maxi suelto de estilo artístico — cae perfecto, muy holgado y extremadamente cómodo.',
    visualDescription: 'loose maxi dress in soft lilac or muted tone, long flowing silhouette, round neckline, short sleeves, artistic literary style, very relaxed oversized fit, lightweight draping fabric, casual elegant',
    price: 264,
    emoji: '🪻',
    image: 'https://img.kwcdn.com/product/fancy/c03ede3a-cb0b-41fa-876a-c99b5b8a54fe.jpg',
    buyUrl: 'https://www.temu.com/mx/vestidos-de-mujer-5020302605906-s.html',
    measurements: { chest: 120, waist: 116, hips: 124, length: 130 },
    tags: ['mama', 'vestido', 'maxi', 'suelto', 'temu', 'comodo', 'holgado'],
  },
  {
    id: 'mama-temu-conjunto-falda-plisada',
    name: 'Conjunto Blusa + Falda Plisada',
    brand: 'Temu',
    size: 'L',
    color: 'Beige/Blanco',
    colorHex: '#E8DCC8',
    type: 'conjunto falda plisada',
    category: 'tops',
    description: 'Conjunto de dos piezas con blusa de botones y falda plisada — elegante y muy fácil de combinar.',
    visualDescription: 'two-piece women set with button-front blouse and pleated midi skirt, beige and white tones, elegant casual style, flowy pleated skirt with matching top, feminine coordinated outfit, lightweight fabric',
    price: 504,
    emoji: '👗',
    image: 'https://img.kwcdn.com/product/fancy/68a97cb2-2623-4f86-aae9-e715fdf94338.jpg',
    buyUrl: 'https://www.temu.com/mx/conjunto-de-falda-de--piezas-elegante-y-suelta-blusa-con-botones-al--y-falda-plisada-ropa-de-mujer-g-601099531867560.html',
    measurements: { chest: 108, waist: 104, hips: 116, length: 110 },
    tags: ['mama', 'conjunto', 'falda', 'plisada', 'temu', 'elegante'],
  },
]

const PERSON_BODY: Record<PersonSize, { chest: number; waist: number; hips: number; height: number }> = {
  XS:  { chest: 79,  waist: 61,  hips: 85,  height: 162 },
  S:   { chest: 84,  waist: 66,  hips: 90,  height: 165 },
  M:   { chest: 89,  waist: 71,  hips: 95,  height: 168 },
  L:   { chest: 95,  waist: 77,  hips: 100, height: 171 },
  XL:  { chest: 101, waist: 83,  hips: 106, height: 173 },
  XXL: { chest: 108, waist: 91,  hips: 113, height: 175 },
}

export const catalog: Garment[] = [

  // ── MUJER — TODO BAJO $700 ────────────────────────────────────────────────────
  {
    id: 'mujer-shein-pleated-midi',
    name: 'Vestido Midi Plisado Fluido',
    brand: 'Shein',
    size: 'M',
    color: 'Café Tostado',
    colorHex: '#8B6340',
    type: 'vestido midi',
    category: 'dresses',
    description: 'Vestido midi plisado de tela fluida — el look elegante casual más guardado en Pinterest para el diario.',
    visualDescription: 'brown pleated flowy midi dress, V-neckline, sleeveless, soft draping fabric with vertical pleats, fitted bodice and flared skirt, elegant casual look',
    price: 299,
    emoji: '✨',
    image: 'https://cdn.caposerio.com/media/images/products/46894/large/donna-abbigliamento-abiti-no-trans-caffe-twinset-261tt3191-l-6665.jpg',
    buyUrl: 'https://www.shein.com.mx/Pleated-Detail-Flowy-Midi-Dress-p-487602.html',
    measurements: { chest: 92, waist: 76, hips: 100, length: 110 },
    tags: ['mujer', 'vestido', 'elegante diario', 'casual', 'viral'],
  },
  {
    id: 'mujer-amazon-basic-midi',
    name: 'Vestido Midi Coqueto Negro',
    brand: 'Amazon',
    size: 'M',
    color: 'Negro',
    colorHex: '#1a1a1a',
    type: 'vestido midi stretch',
    category: 'dresses',
    description: 'Vestido midi negro coqueto con abertura — el negro infalible para cualquier ocasión. Elegante, cómodo y versátil.',
    visualDescription: 'black elegant midi dress with slit opening, fitted silhouette, minimalist design, versatile for work and evening outings',
    price: 499,
    emoji: '🖤',
    image: 'http://ninabouhn.com/cdn/shop/files/IMG_0069.jpg?v=1754879345',
    buyUrl: 'https://www.amazon.com.mx/Vestido-coqueto-elegante-abertura-perfecto/dp/B0D1VP592Z',
    measurements: { chest: 92, waist: 76, hips: 100, length: 108 },
    tags: ['mujer', 'vestido', 'elegante diario', 'negro', 'básico', 'viral'],
  },
  {
    id: 'mujer-amazon-flowing-midi',
    name: 'Vestido Midi Fluido Beige',
    brand: 'Amazon',
    size: 'M',
    color: 'Beige',
    colorHex: '#C4A882',
    type: 'vestido midi fluido',
    category: 'dresses',
    description: 'Vestido midi fluido beige — caída suave y silueta femenina. El favorito de Pinterest para look casual chic.',
    visualDescription: 'beige tone flowing midi dress, soft draping fabric with elegant movement, halter neckline, relaxed feminine silhouette, casual chic style',
    price: 599,
    emoji: '🍂',
    image: 'https://www.the-are.com/cdn/shop/files/vestido-midi-asimetrico-beige-cuello-halter-invitada-mujer-the-are-1.jpg?v=174893',
    buyUrl: 'https://www.amazon.com.mx/Vestido-manga-elegante-informal-invierno/dp/B0GXV7KP4V',
    measurements: { chest: 92, waist: 76, hips: 100, length: 108 },
    tags: ['mujer', 'vestido', 'elegante diario', 'casual'],
  },
  {
    id: 'mujer-amazon-floral-midi',
    name: 'Vestido Midi Estampado Flores',
    brand: 'Amazon',
    size: 'M',
    color: 'Floral Multicolor',
    colorHex: '#D4849A',
    type: 'vestido midi floral',
    category: 'dresses',
    description: 'Vestido midi estampado flores — print primaveral favorito de Pinterest. Femenino y actual.',
    visualDescription: 'floral print midi dress, vibrant multicolor floral pattern, gathered ruffle details, feminine silhouette, relaxed fit with flowing skirt, spring-summer style',
    price: 649,
    emoji: '🌸',
    image: 'https://m.media-amazon.com/images/I/91G9LyFt2yL.__AC_SX342_SY445_QL70_ML2_.jpg',
    buyUrl: 'https://www.amazon.com.mx/Vestido-estampado-ajustado-fruncido-volantes/dp/B0DJPNPK6B',
    measurements: { chest: 92, waist: 76, hips: 100, length: 108 },
    tags: ['mujer', 'vestido', 'floral', 'elegante diario', 'casual', 'viral'],
  },
  {
    id: 'mujer-amazon-linen-blend-midi',
    name: 'Vestido Midi Elegante Crema',
    brand: 'Amazon',
    size: 'M',
    color: 'Crema Natural',
    colorHex: '#E8DCC8',
    type: 'vestido midi lino',
    category: 'dresses',
    description: 'Vestido midi crema con volantes — textura natural, fresco y elegante. El más buscado en Pinterest para brunch.',
    visualDescription: 'cream off-white elegant midi dress with ruffled hem, breathable fabric, round neckline, sleeveless, relaxed elegant silhouette, summer-ready',
    price: 699,
    emoji: '🌿',
    image: 'https://www.puntoblanco.co/cdn/shop/files/ettena-crema-15087-747877_015087-3.jpg?v=1740170301&width=1000',
    buyUrl: 'https://www.amazon.com.mx/Vestidos-Elegantes-Volantes-Vestido-Redondo/dp/B0F8C415H2',
    measurements: { chest: 92, waist: 76, hips: 100, length: 108 },
    tags: ['mujer', 'vestido', 'lino', 'elegante', 'viral'],
  },

  // ── HOMBRE — AGENCIA IA / NEGRO (todos bajo $500) ─────────────────────────────
  {
    id: 'hombre-amazon-mock-neck-negro',
    name: 'Top Mock Neck Textura Negro',
    brand: 'Amazon',
    size: 'M',
    color: 'Negro',
    colorHex: '#0a0a0a',
    type: 'camiseta cuello alto',
    category: 'tops',
    description: 'Mock neck negro texturizado — el look Steve Jobs / tech CEO más viral de TikTok 2025. Minimalismo total, máximo impacto.',
    visualDescription: 'black textured mock neck top, minimal clean design, slim fit, ribbed turtleneck collar, textured matte fabric, tech CEO aesthetic',
    price: 349,
    emoji: '⚡',
    image: 'https://m.media-amazon.com/images/I/51xpeKMJW0L._AC_SL1500_.jpg',
    buyUrl: 'https://www.amazon.com.mx/Camiseta-cuello-dise%C3%B1o-camiseta-el%C3%A1stica/dp/B09MJTZ9PK',
    measurements: { chest: 108, waist: 104, length: 72 },
    tags: ['hombre', 'negro', 'agencia ia', 'tech', 'minimalista', 'viral'],
  },
  {
    id: 'hombre-charly-polo-negro',
    name: 'Polo Piqué Básico Negro',
    brand: 'CHARLY',
    size: 'M',
    color: 'Negro',
    colorHex: '#0a0a0a',
    type: 'polo piqué',
    category: 'tops',
    description: 'Polo piqué básico negro — elegancia técnica que combina con todo. El uniforme del fundador moderno.',
    visualDescription: 'black piqué polo shirt, fine cotton piqué knit texture, ribbed collar and sleeve cuffs, two-button placket, slim fit, clean minimal look, no logos',
    price: 449,
    emoji: '🖤',
    image: 'https://www.paviitaly.com/wp-content/uploads/2-16-scaled.jpg',
    buyUrl: 'https://www.amazon.com.mx/CHARLY-5007923-Hombre-Negro-Black/dp/B0C6FY27DW',
    measurements: { chest: 108, waist: 104, length: 72 },
    tags: ['hombre', 'negro', 'agencia ia', 'polo', 'elegante', 'viral'],
  },
  {
    id: 'hombre-amazon-camisa-negra-lino',
    name: 'Camisa 100% Lino Negro',
    brand: 'Amazon',
    size: 'M',
    color: 'Negro',
    colorHex: '#0a0a0a',
    type: 'camisa lino',
    category: 'tops',
    description: 'Camisa 100% lino negro — el upgrade del fundador. Fresca, con carácter, lista para escenarios y pitches.',
    visualDescription: 'black 100% linen shirt, natural linen texture with characteristic subtle wrinkles, relaxed fit, lapel collar, long sleeves with button cuffs, breathable summer fabric, sophisticated dark look',
    price: 499,
    emoji: '🌑',
    image: 'https://cocojamboocr.com/cdn/shop/files/IMG_9505.jpg?v=1737748023&width=990',
    buyUrl: 'https://www.amazon.com.mx/b%C3%A1sica-algod%C3%B3n-transpirable-holgada-delgada/dp/B0C5HJJ3P2',
    measurements: { chest: 110, waist: 106, length: 74 },
    tags: ['hombre', 'negro', 'agencia ia', 'lino', 'camisa', 'viral'],
  },
  {
    id: 'hombre-lion-camisa-slim-negra',
    name: 'Camisa Slim Sin Arrugas Negro',
    brand: 'Lion Nardo',
    size: 'M',
    color: 'Negro',
    colorHex: '#0a0a0a',
    type: 'camisa slim estructurada',
    category: 'tops',
    description: 'Camisa slim negra sin arrugas — para demos, pitches y networking. Proyecta liderazgo sin esfuerzo.',
    visualDescription: 'black wrinkle-free slim fit dress shirt, smooth stretch fabric, tailored silhouette, minimalist design, sharp professional look',
    price: 449,
    emoji: '💼',
    image: 'https://http2.mlstatic.com/D_NQ_NP_996409-MLA84004733927_042025-O.webp',
    buyUrl: 'https://www.amazon.com.mx/Lion-Nardo-Camisas-arrugas-camisas/dp/B0CWSKHXV5',
    measurements: { chest: 106, waist: 100, length: 74 },
    tags: ['hombre', 'negro', 'agencia ia', 'camisa', 'slim', 'elegante', 'formal'],
  },
  {
    id: 'hombre-essentials-polo-negro',
    name: 'Polo Piqué Regular Fit Negro',
    brand: 'Amazon Essentials',
    size: 'M',
    color: 'Negro',
    colorHex: '#0a0a0a',
    type: 'camisa regular fit',
    category: 'tops',
    description: 'Polo piqué regular fit negro — el look "stealth wealth" que domina los Zooms y conferencias de fundadores tech.',
    visualDescription: 'black regular fit piqué polo shirt, relaxed clean silhouette, ribbed collar, minimal design, modern workwear style',
    price: 449,
    emoji: '🔲',
    image: 'https://siman.vtexassets.com/arquivos/ids/6483567/104817210-1--1-.jpg?v=638721177767470000',
    buyUrl: 'https://www.amazon.com.mx/Amazon-Essentials-Ajuste-Regular-Hombre/dp/B09Q87N2TW',
    measurements: { chest: 118, waist: 114, length: 78 },
    tags: ['hombre', 'negro', 'agencia ia', 'casual', 'tech'],
  },

  // ── HOMBRE — OLD MONEY / TONOS NATURALES (bajo $500) ─────────────────────────
  {
    id: 'om-essentials-linen-polo-white',
    name: 'Camisa Lino Regular Fit Blanco',
    brand: 'Amazon Essentials',
    size: 'M',
    color: 'Blanco Roto',
    colorHex: '#F5F0E8',
    type: 'polo lino',
    category: 'tops',
    description: '100% lino, cuello solapa abierto — el polo más viral del old money Pinterest. El mejor dupe del lino de lujo.',
    visualDescription: 'white off-white 100% linen polo shirt, open camp collar, slightly wrinkled natural linen texture, relaxed fit, minimal design with no logos',
    price: 399,
    emoji: '🌿',
    image: 'https://aurelien-online.com/cdn/shop/files/Aurelien_polo_shirt_linen_men_white1.jpg?v=1745832184&width=1200',
    buyUrl: 'https://www.amazon.com.mx/Amazon-Essentials-Hombre-Regular-fit-Camisa/dp/B06XRQDCCW',
    measurements: { chest: 108, waist: 104, length: 72 },
    tags: ['hombre', 'old money', 'polo', 'lino', 'blanco', 'casual', 'viral'],
  },
  {
    id: 'om-amazon-linen-polo-negro',
    name: 'Polo 100% Lino Negro',
    brand: 'Amazon',
    size: 'M',
    color: 'Negro',
    colorHex: '#0a0a0a',
    type: 'polo lino',
    category: 'tops',
    description: 'Polo 100% lino negro — la pieza de lino más versátil. Entre old money y agencia IA.',
    visualDescription: 'black 100% linen polo shirt, natural linen texture, relaxed fit, minimal design, sophisticated dark summer look',
    price: 399,
    emoji: '☀️',
    image: 'https://d1fufvy4xao6k9.cloudfront.net/looks/3093/black-polo-shirt-with-grey-linen-trousers.jpg',
    buyUrl: 'https://www.amazon.com.mx/Playera-Hombre-confeccionada-pique-770160/dp/B08G9TCHN8',
    measurements: { chest: 108, waist: 104, length: 72 },
    tags: ['hombre', 'old money', 'negro', 'polo', 'lino', 'casual'],
  },
  {
    id: 'hombre-essentials-polo-blanco',
    name: 'Polo Piqué Básico Blanco',
    brand: 'Amazon Essentials',
    size: 'M',
    color: 'Blanco',
    colorHex: '#FAFAFA',
    type: 'polo slim',
    category: 'tops',
    description: 'Polo piqué básico blanco — clásico atemporal. La base perfecta del guardarropa de cualquier founder.',
    visualDescription: 'white slim fit piqué polo shirt, tailored clean silhouette, smooth cotton piqué fabric, ribbed collar and cuffs, minimal design, clean professional casual look',
    price: 449,
    emoji: '🤍',
    image: 'https://cache.mrporter.com/variants/images/4068790126487369/in/w2000_q60.jpg',
    buyUrl: 'https://www.amazon.com.mx/Amazon-Essentials-algod%C3%B3n-Hombre-Blanco/dp/B07X8XLDSY',
    measurements: { chest: 106, waist: 100, length: 72 },
    tags: ['hombre', 'old money', 'polo', 'blanco', 'slim', 'elegante'],
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

function describeChestFit(ease: number): string {
  if (ease <= -10) return `chest is severely constricted — ${Math.abs(ease)}cm too small, fabric stretched to maximum tension`
  if (ease < -4)  return `chest is too tight with ${Math.abs(ease)}cm deficit — fabric pulled taut across torso`
  if (ease < 0)   return `chest is slightly snug with ${Math.abs(ease)}cm deficit — fabric contours closely to the body`
  if (ease < 6)   return `chest is body-hugging with ${ease}cm ease — fabric sits flush against the torso`
  if (ease < 14)  return `chest has a classic fitted silhouette with ${ease}cm ease`
  if (ease < 22)  return `chest is relaxed with ${ease}cm of ease — fabric drapes gently away from the body`
  if (ease < 32)  return `chest is noticeably loose with ${ease}cm excess — fabric hangs in soft folds`
  return `chest is dramatically oversized with ${ease}cm excess — fabric cascades in deep folds`
}

function describeShoulders(chestEase: number): string {
  const drop = Math.round(Math.max(0, chestEase - 5) / 10 * 2.8)
  if (chestEase <= -5) return `shoulder seams are pulled inward toward the base of the neck, restricting movement`
  if (chestEase < 5)   return `shoulder seams sit precisely at the natural shoulder point, perfect alignment`
  if (chestEase < 12)  return `shoulder seams rest just at the shoulder tip with a barely noticeable 1cm droop`
  if (chestEase < 22)  return `shoulder seams have fallen ${drop}cm below the natural shoulder onto the upper arm`
  if (chestEase < 32)  return `shoulder seams hang ${drop}cm down the upper arm, creating a clearly dropped-shoulder silhouette`
  return `shoulder seams hang ${drop + 1}cm down the upper arm — dramatically oversized drop-shoulder look`
}

function describeWaist(garmentWaist: number | undefined, bodyWaist: number): string {
  if (!garmentWaist) return ''
  const ease = garmentWaist - bodyWaist
  if (ease < -4)  return `waist is constricting — ${Math.abs(ease)}cm too tight, fabric pressing against the midsection`
  if (ease < 4)   return `waist is trim and fitted, following the natural waist closely`
  if (ease < 14)  return `waist has a relaxed fit with ${ease}cm of ease`
  if (ease < 24)  return `waist is loose with ${ease}cm excess, fabric gathers in horizontal folds`
  return `waist is very baggy with ${ease}cm excess, fabric bunches heavily`
}

function describeHemLength(
  garmentLength: number | undefined,
  personHeight: number,
  category: Garment['category']
): string {
  if (!garmentLength) return ''
  const shoulderToFloor = Math.round(personHeight * 0.84)
  const shoulderToWaist = Math.round(personHeight * 0.26)
  const shoulderToHip   = Math.round(personHeight * 0.39)
  const hemFromShoulder = garmentLength

  if (category === 'tops' || category === 'outerwear') {
    if (hemFromShoulder < shoulderToWaist - 8) return `the hem falls well above the natural waist — a dramatic crop`
    if (hemFromShoulder < shoulderToWaist)     return `the hem rests just above the waist, a cropped style`
    if (hemFromShoulder < shoulderToWaist + 6) return `the hem sits at the natural waist level`
    if (hemFromShoulder < shoulderToHip)       return `the hem falls between waist and hip bones`
    if (hemFromShoulder < shoulderToHip + 8)   return `the hem reaches to hip-bone level, standard length`
    if (hemFromShoulder < shoulderToHip + 18)  return `the hem extends ${hemFromShoulder - shoulderToHip}cm below the hip`
    return `the hem is very long at ${hemFromShoulder - shoulderToHip}cm below the hip`
  }

  if (category === 'dresses') {
    const hemFromFloor = shoulderToFloor - hemFromShoulder
    if (hemFromFloor > 50) return `mini dress — hem sits high on the thigh`
    if (hemFromFloor > 30) return `midi length — hem falls at mid-calf`
    if (hemFromFloor > 10) return `maxi length — hem near the ankle`
    return `floor-length dress, hem sweeps the ground`
  }

  return ''
}

function describeSleeveLength(chestEase: number, lengthEase: number | null, category: Garment['category']): string {
  if (category === 'dresses' || category === 'bottoms') return ''
  const sleeveExtra = Math.round((chestEase / 20) * 3 + (lengthEase ?? 0) * 0.4)
  if (sleeveExtra <= -4) return `sleeves end 4cm or more above the wrist — visibly too short`
  if (sleeveExtra < -1) return `sleeves fall slightly above the wrist, a touch short`
  if (sleeveExtra < 3)  return `sleeve length reaches the wrist correctly`
  if (sleeveExtra < 6)  return `sleeves extend ${sleeveExtra}cm past the wrist`
  if (sleeveExtra < 10) return `sleeves hang ${sleeveExtra}cm past the wrist, covering the knuckles`
  return `sleeves are very long, extending ${sleeveExtra}cm past the wrist`
}

function describeFabricBehavior(ease: number, garmentType: string): string {
  const fabric = garmentType.toLowerCase()
  const isSoft = fabric.includes('hoodie') || fabric.includes('camiseta') || fabric.includes('vestido')
  const isStructured = fabric.includes('blazer') || fabric.includes('chamarra')

  if (ease < -5) {
    return isStructured
      ? `structured fabric under strain: diagonal pull lines visible, seams near tearing`
      : `soft fabric stretched taut, clinging to every curve with tense horizontal stress lines`
  }
  if (ease < 5) {
    return isStructured
      ? `structured fabric follows the body cleanly with sharp, precise silhouette`
      : `soft fabric conforms smoothly to the body with gentle natural drape`
  }
  if (ease < 20) {
    return isStructured
      ? `structured fabric maintains shape with controlled drape`
      : `soft fabric falls in easy, natural folds with graceful drape`
  }
  return isStructured
    ? `structured fabric distorts under excess ease: shoulders buckle, lapels gap`
    : `soft fabric cascades in abundant, deep folds — gravity pulling fabric into layered pleats`
}

export function buildTryOnPrompt(garment: Garment, personSize: PersonSize, hasGarmentImage = false): string {
  const body = PERSON_BODY[personSize]
  const m = garment.measurements

  const chestEase  = m.chest  != null ? m.chest  - body.chest  : null
  const waistEase  = m.waist  != null ? m.waist  - body.waist  : null
  const lengthEase = m.length != null ? m.length - (body.height * 0.42) : null

  const chestBlock   = chestEase != null ? `Torso: ${describeChestFit(chestEase)}.` : ''
  const shoulderBlock = chestEase != null ? `Shoulders: ${describeShoulders(chestEase)}.` : ''
  const waistBlock   = waistEase  != null ? `Waist: ${describeWaist(m.waist, body.waist)}.` : ''
  const hemBlock     = m.length   != null ? `Hem: ${describeHemLength(m.length, body.height, garment.category)}.` : ''
  const sleeveBlock  = describeSleeveLength(chestEase ?? 0, lengthEase, garment.category)
    ? `Sleeves: ${describeSleeveLength(chestEase ?? 0, lengthEase, garment.category)}.` : ''
  const fabricBlock  = chestEase != null ? `Fabric behavior: ${describeFabricBehavior(chestEase, garment.type)}.` : ''

  const visualAppearance = garment.visualDescription
    ?? `${garment.color} ${garment.type} by ${garment.brand}`

  const lines = [
    `Replace the clothing of the person in this photo with the following garment: ${visualAppearance}.`,
    `The person wears size ${personSize} but the garment is size ${garment.size} (chest ${m.chest ?? '?'}cm vs body chest ${body.chest}cm).`,
    `This creates a ${chestEase != null && chestEase >= 0 ? chestEase + 'cm excess' : Math.abs(chestEase ?? 0) + 'cm deficit'} — the resulting fit MUST be physically accurate and clearly visible.`,
    chestBlock, shoulderBlock, waistBlock, hemBlock, sleeveBlock, fabricBlock,
    hasGarmentImage
      ? `The attached garment reference image shows the EXACT item — match its color, fabric texture, logos, stitching, seam lines, buttons, and all design details precisely.`
      : `Render the garment with photorealistic fabric texture, accurate color (${garment.color}), and all visual details as described above.`,
    `Photorealistic fashion photo: natural lighting consistent with the input photo, realistic fabric shadows and highlights, 4K detail.`,
    `PRESERVE EXACTLY: the person's face, skin tone, hair, body proportions, pose, and the original photo background. Change ONLY the clothing.`,
  ]

  return lines.filter(Boolean).join(' ')
}
