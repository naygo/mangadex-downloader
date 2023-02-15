import type {
  MangadexApiReponse,
  Manga,
  MangaDexResponse,
  Cover
} from '@/models/interfaces'
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
        'order[relevance]': 'desc',
        'includes[]': 'author'
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

export async function getMangaCovers(
  mangaId: string
): Promise<MangadexApiReponse<MangaDexResponse<Cover>>> {
  const response: { data: MangadexApiReponse<MangaDexResponse<Cover>> } =
    await mangadexClient.get('/cover', {
      params: {
        limit: 100,
        'manga[]': mangaId,
        'order[volume]': 'asc'
      }
    })

  return response.data
}
