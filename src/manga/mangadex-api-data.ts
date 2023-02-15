import type { MangadexApiReponse, Manga } from '../models/interfaces'
import { mangadexClient } from './mangadex-clients'

export async function findMangaByTitle(
  title: string,
  page?: number,
  limit = 10
): Promise<MangadexApiReponse<Manga[]>> {
  const offset = page != null ? page * limit : 0

  const response: { data: MangadexApiReponse<Manga[]> } =
    await mangadexClient.get('/manga', {
      params: {
        title,
        offset,
        'order[relevance]': 'desc'
      }
    })

  return response.data
}

export async function findMangaById(
  id: string
): Promise<MangadexApiReponse<Manga>> {
  const response: { data: MangadexApiReponse<Manga> } =
    await mangadexClient.get(`/manga/${id}`)

  return response.data
}
