import { NextRequest, NextResponse } from 'next/server'
import {
  saldo, verificar, nuevoId, firmar, almacenListo, firmaListo,
  CREDITOS_DE_PAGO, abonar,
} from '@/lib/creditos'

export const runtime = 'nodejs'

/* GET /api/creditos — cuantos le quedan a este navegador.
 *
 * Es la unica fuente de verdad del saldo. La pantalla ya no lo lee de
 * localStorage: lo pregunta aqui. */
export async function GET(req: NextRequest) {
  const galleta = req.cookies.get('fitaii_uid')?.value
  let id = verificar(galleta)
  const nuevo = !id
  if (!id) id = nuevoId()

  const res = NextResponse.json({
    creditos: await saldo(id),
    // Avisos para el panel, no para el cliente: si alguno sale en false, los
    // creditos NO son de fiar todavia.
    persistente: almacenListo(),
    firmado: firmaListo(),
  })

  if (nuevo) {
    res.cookies.set('fitaii_uid', firmar(id), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  }
  return res
}

/* POST /api/creditos — abona los creditos del pago.
 *
 * Protegido con ADMIN_PASS porque abonar credito ES dar dinero. Mientras no
 * haya pasarela de pago, esto es lo que se corre a mano despues de que Carlos
 * confirma los 500 pesos. */
export async function POST(req: NextRequest) {
  const clave = req.headers.get('x-admin-pass') || ''
  const esperada = process.env.ADMIN_PASS || ''
  if (!esperada || clave !== esperada) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { uid, cuantos } = await req.json().catch(() => ({}))
  if (!uid) return NextResponse.json({ error: 'Falta uid' }, { status: 400 })

  const total = await abonar(String(uid), Number(cuantos) || CREDITOS_DE_PAGO)
  return NextResponse.json({ uid, creditos: total })
}
