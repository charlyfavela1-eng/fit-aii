import { NextRequest, NextResponse } from 'next/server'
import { generarProbado } from '@/lib/wavespeed'
import { cobrar, devolver, verificar, nuevoId, firmar, saldo } from '@/lib/creditos'

export const runtime = 'nodejs'

/* Genera una prueba de prenda.
 *
 * Cambia dos cosas respecto de la version anterior:
 *
 *   1. Ya no le pega a Atlas (sin saldo desde el 27-jul y con la URL vacia en
 *      el entorno, o sea 500 antes de intentar nada). Ahora es GPT Image 2 en
 *      WaveSpeed.
 *   2. El credito se cobra AQUI, no en el navegador. Antes `localStorage`
 *      decidia si podias generar, y eso lo edita cualquiera.
 */
export async function POST(req: NextRequest) {
  try {
    const { photoBase64, prompt, garmentImageUrl } = await req.json()

    if (!photoBase64 || !prompt) {
      return NextResponse.json({ error: 'Faltan la foto o el prompt' }, { status: 400 })
    }

    // Identidad: cookie firmada. Si no trae una valida, se le crea ahora.
    const galleta = req.cookies.get('fitaii_uid')?.value
    let id = verificar(galleta)
    let hayQueSembrar = false
    if (!id) { id = nuevoId(); hayQueSembrar = true }

    if (!(await cobrar(id))) {
      const res = NextResponse.json(
        { error: 'Sin creditos. Recarga para seguir probando prendas.', creditos: 0 },
        { status: 402 }
      )
      if (hayQueSembrar) ponerCookie(res, id)
      return res
    }

    /* El orden importa: la primera imagen es la que GPT Image edita (la
       persona), la segunda es la referencia de la prenda. Sin la segunda el
       modelo se inventa la prenda a partir del texto, que es justo lo que
       hacia antes y por lo que "probarse ropa de otras paginas" no funcionaba. */
    const imagenes = [photoBase64]
    if (garmentImageUrl) imagenes.push(garmentImageUrl)

    const salida = await generarProbado(imagenes, prompt)

    if (salida.estado === 'failed') {
      await devolver(id)   // no se cobra lo que no se entrego
      const res = NextResponse.json(
        { error: salida.error, creditos: await saldo(id) },
        { status: 502 }
      )
      if (hayQueSembrar) ponerCookie(res, id)
      return res
    }

    const res = NextResponse.json({
      status: salida.estado,
      imageUrl: salida.imagen,
      predictionId: salida.id,
      creditos: await saldo(id),
    })
    if (hayQueSembrar) ponerCookie(res, id)
    return res
  } catch (error) {
    console.error('Error al generar:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

function ponerCookie(res: NextResponse, id: string) {
  res.cookies.set('fitaii_uid', firmar(id), {
    httpOnly: true,          // el JavaScript de la pagina no lo puede leer ni cambiar
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}
