import { NextRequest, NextResponse } from 'next/server'
import { consultar } from '@/lib/wavespeed'
import { verificar, devolver, saldo } from '@/lib/creditos'

export const runtime = 'nodejs'

/* Consulta una generacion ya lanzada.
 *
 * Antes preguntaba a Atlas en `/prediction/{id}`; ahora a WaveSpeed en
 * `/predictions/{id}/result`. Y si la generacion fallo, el credito se devuelve
 * AQUI tambien: el cobro ocurre al lanzar, asi que una falla que aparece en el
 * sondeo dejaria al cliente pagando por una imagen que nunca vio. */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

  const salida = await consultar(id)
  const usuario = verificar(req.cookies.get('fitaii_uid')?.value)

  if (salida.estado === 'failed') {
    if (usuario) await devolver(usuario)
    return NextResponse.json({
      status: 'failed',
      error: salida.error,
      creditos: usuario ? await saldo(usuario) : undefined,
    })
  }

  if (salida.estado === 'completed') {
    return NextResponse.json({
      status: 'completed',
      imageUrl: salida.imagen,
      creditos: usuario ? await saldo(usuario) : undefined,
    })
  }

  return NextResponse.json({ status: 'pending' })
}
