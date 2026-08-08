/* Creditos del lado del SERVIDOR.
 *
 * El problema que resuelve: `lib/credits.ts` los guardaba en `localStorage` con
 * la llave `fitaii_credits_v1`. Cualquiera abre la consola, se escribe 9999 y
 * se prueba ropa gratis para siempre; o borra el dato y le vuelve a tocar el
 * credito gratis. No se puede cobrar por algo que el cliente se puede regalar
 * solo, asi que la cuenta se lleva aqui y el navegador solo la muestra.
 *
 * Identidad sin registro: una cookie httpOnly con un id aleatorio FIRMADO con
 * HMAC. El navegador no puede inventarse un id valido sin el secreto, y como es
 * httpOnly tampoco lo puede leer el JavaScript de la pagina.
 *
 * Almacen: Upstash por REST, igual que la app del taxi (ahi ya esta probado que
 * sobrevive a los despliegues de Render). Sin Upstash configurado cae a memoria
 * del proceso, que se borra en cada despliegue — sirve para desarrollo y NO
 * para cobrar. `almacenListo()` lo dice para poder avisarlo.
 */

import crypto from 'crypto'

const UPSTASH_URL = (process.env.UPSTASH_URL || '').replace(/\/+$/, '')
const UPSTASH_TOKEN = process.env.UPSTASH_TOKEN || ''
const SECRETO = process.env.CREDITOS_SECRET || ''

/** Creditos de regalo para quien llega por primera vez. */
export const CREDITOS_GRATIS = 1

/** Lo que entra al pagar los 500 pesos: 100 pesos de credito. A 18 pesos por
 *  dolar son ~$5.55, y a $0.082 por prueba (1k medium, dos imagenes de
 *  entrada) alcanzan para 67. Se anuncian 60 para dejar margen a los
 *  reintentos, que los va a haber por el filtro de contenido. */
export const CREDITOS_DE_PAGO = 60

const memoria = new Map<string, number>()

export function almacenListo(): boolean {
  return !!(UPSTASH_URL && UPSTASH_TOKEN)
}

export function firmaListo(): boolean {
  return !!SECRETO
}

/* ---------------------------------------------------------------- identidad */

export function nuevoId(): string {
  return crypto.randomBytes(16).toString('hex')
}

export function firmar(id: string): string {
  const mac = crypto.createHmac('sha256', SECRETO || 'dev').update(id).digest('hex').slice(0, 32)
  return `${id}.${mac}`
}

/** Devuelve el id si la firma cuadra, o null. Comparacion en tiempo constante. */
export function verificar(cookie: string | undefined): string | null {
  if (!cookie) return null
  const [id, mac] = cookie.split('.')
  if (!id || !mac) return null
  const esperado = crypto.createHmac('sha256', SECRETO || 'dev').update(id).digest('hex').slice(0, 32)
  const a = Buffer.from(mac)
  const b = Buffer.from(esperado)
  if (a.length !== b.length) return null
  return crypto.timingSafeEqual(a, b) ? id : null
}

/* ------------------------------------------------------------------ almacen */

async function leerCrudo(id: string): Promise<number | null> {
  if (!almacenListo()) return memoria.has(id) ? memoria.get(id)! : null
  try {
    const r = await fetch(`${UPSTASH_URL}/get/fitaii:cred:${id}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store',
    })
    if (!r.ok) return null
    const { result } = await r.json()
    return result === null || result === undefined ? null : parseInt(String(result), 10)
  } catch {
    return null
  }
}

async function escribir(id: string, valor: number): Promise<void> {
  if (!almacenListo()) { memoria.set(id, valor); return }
  try {
    await fetch(`${UPSTASH_URL}/set/fitaii:cred:${id}/${valor}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    })
  } catch { /* si Upstash no contesta, el saldo no cambia: mejor eso que regalar */ }
}

/* -------------------------------------------------------------------- saldo */

export async function saldo(id: string): Promise<number> {
  const v = await leerCrudo(id)
  if (v === null) {
    await escribir(id, CREDITOS_GRATIS)
    return CREDITOS_GRATIS
  }
  return v
}

/** Cobra un credito. Devuelve false si no alcanza — y entonces NO se llama al
 *  proveedor. El cobro va ANTES de generar a proposito: si se cobrara despues,
 *  una desconexion a media generacion sale gratis para el cliente y cara para
 *  nosotros. Si la generacion falla, `devolver()` lo regresa. */
export async function cobrar(id: string): Promise<boolean> {
  const actual = await saldo(id)
  if (actual <= 0) return false
  await escribir(id, actual - 1)
  return true
}

export async function devolver(id: string): Promise<void> {
  const actual = await saldo(id)
  await escribir(id, actual + 1)
}

export async function abonar(id: string, cuantos: number): Promise<number> {
  const actual = await saldo(id)
  const nuevo = actual + cuantos
  await escribir(id, nuevo)
  return nuevo
}
