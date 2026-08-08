/* Puente a WaveSpeed para el probador.
 *
 * Antes esto le pegaba a Atlas (`ATLAS_API_URL` + `generateImage`). Atlas se
 * quedo sin saldo el 27 de julio y la variable de la URL quedo vacia, asi que
 * la ruta devolvia 500 antes de intentar nada: la app no probaba ni una prenda.
 *
 * Dos trampas de WaveSpeed que ya costaron dinero antes y que aqui NO se
 * repiten:
 *
 *   1. El modelo va en la URL, no en el cuerpo. `POST /api/v3/predictions` es
 *      el LISTADO del historial de la cuenta: postear ahi devuelve la ultima
 *      prediccion vieja y parece cache, pero es que no se genero nada.
 *   2. El precio depende de calidad x resolucion, no es fijo. La formula del
 *      catalogo (verificada hoy) es:
 *
 *        low:    1k $0.02  2k $0.03  4k $0.04
 *        medium: 1k $0.07  2k $0.11  4k $0.19
 *        high:   1k $0.23  2k $0.41  4k $0.73
 *        + $0.012 por cada imagen de entrada despues de la primera
 *
 *      Aqui se manda 1k/medium a proposito: son $0.082 por prueba con la foto
 *      de la persona mas la de la prenda. Se ve en un celular; nadie hace zoom
 *      a 2k para decidir una talla, y 2k costaria 49% mas por prueba.
 */

const BASE = 'https://api.wavespeed.ai/api/v3'
const MODELO = 'openai/gpt-image-2/edit'

export const CALIDAD = 'medium'
export const RESOLUCION = '1k'

/** Lo que cuesta una prueba, en dolares. Se usa para avisar y para cuadrar. */
export function costoPorPrueba(numImagenes: number): number {
  const base = RESOLUCION === '1k' ? 0.07 : 0.11
  return base + Math.max(0, numImagenes - 1) * 0.012
}

export interface ResultadoImagen {
  estado: 'completed' | 'pending' | 'failed'
  imagen?: string
  id?: string
  error?: string
}

function llave(): string {
  const k = process.env.WAVESPEED_API_KEY
  if (!k) throw new Error('Falta WAVESPEED_API_KEY')
  return k
}

/** Lanza la generacion. `imagenes` va [persona, prenda?] — el orden importa:
 *  GPT Image trata la primera como la que se edita. */
export async function generarProbado(
  imagenes: string[],
  prompt: string
): Promise<ResultadoImagen> {
  const r = await fetch(`${BASE}/${MODELO}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${llave()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: imagenes,
      prompt,
      quality: CALIDAD,
      resolution: RESOLUCION,
    }),
  })

  const j = await r.json().catch(() => ({}))
  if (!r.ok) {
    return { estado: 'failed', error: `WaveSpeed ${r.status}: ${JSON.stringify(j).slice(0, 200)}` }
  }

  const id = j?.data?.id
  if (!id) return { estado: 'failed', error: 'WaveSpeed no devolvio id' }

  // A veces ya viene lista en la misma respuesta.
  const salidaInmediata = j?.data?.outputs?.[0]
  if (salidaInmediata) return { estado: 'completed', imagen: salidaInmediata }

  return { estado: 'pending', id }
}

/** Consulta una generacion lanzada. */
export async function consultar(id: string): Promise<ResultadoImagen> {
  const r = await fetch(`${BASE}/predictions/${id}/result`, {
    headers: { Authorization: `Bearer ${llave()}` },
  })
  const j = await r.json().catch(() => ({}))
  const d = j?.data || {}

  if (d.status === 'completed') {
    const url = d.outputs?.[0]
    return url
      ? { estado: 'completed', imagen: url }
      : { estado: 'failed', error: 'completado sin imagen' }
  }
  if (d.status === 'failed') {
    /* GPT Image 2 tiene falsos positivos de seguridad, y este caso es el peor
       posible: fotos de personas mas ropa. El mensaje crudo no le sirve de nada
       al usuario, asi que se traduce. */
    const crudo = JSON.stringify(d.error || d).toLowerCase()
    const esModeracion = crudo.includes('safety') || crudo.includes('policy') || crudo.includes('moderation')
    return {
      estado: 'failed',
      error: esModeracion
        ? 'La foto no paso el filtro de contenido. Intenta con una foto de cuerpo completo, bien iluminada y con ropa puesta.'
        : `Fallo la generacion: ${JSON.stringify(d.error || d).slice(0, 160)}`,
    }
  }
  return { estado: 'pending', id }
}
