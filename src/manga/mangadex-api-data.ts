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
    await mangadexClient.get(`/manga/${id}`, {
      params: {
        'includes[]': 'author'
      }
    })

  return response.data
}

export async function getMangaCovers(
  mangaId: string,
  offset = 0
): Promise<MangadexApiReponse<Array<MangaDexResponse<Cover>>>> {
  const response: { data: MangadexApiReponse<Array<MangaDexResponse<Cover>>> } =
    await mangadexClient.get('/cover', {
      params: {
        limit: 100,
        offset,
        'manga[]': mangaId,
        'order[volume]': 'asc'
      }
    })

  return response.data
}
