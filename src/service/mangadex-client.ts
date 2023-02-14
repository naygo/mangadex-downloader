import type { MangadexApiReponse } from '../interfaces/api'
import type { Manga } from '../interfaces/manga'
import { mangadexClient } from './mangadex-api-data'

export const findMangasByName = async (title: string, page?: number): Promise<MangadexApiReponse<Manga[]>> => {
  const response: { data: MangadexApiReponse<Manga[]> } = await mangadexClient.get('/manga', {
    params: {
      title,
      offset: page
    }
  })

  return response.data
}

export const getMangaById = async (id: string): Promise<MangadexApiReponse<Manga>> => {
  const response: { data: MangadexApiReponse<Manga> } = await mangadexClient.get(`/manga/${id}`)

  return response.data
}
