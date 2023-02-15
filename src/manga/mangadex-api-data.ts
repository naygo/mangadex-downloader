
import { mangadexClient } from './mangadex-clients'

import type {
  MangadexApiReponse, Manga, MangaDexResponse,
  Cover
} from '../models/interfaces'
import type { MangadexAggregate } from '../models/interfaces/aggregate'
import type { Volume } from '../models/interfaces/volume'
import { formatVolumes } from '../utils/format-volumes'
import type { Chapter, MangadexChapter } from '../models/interfaces/chapter'

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

export async function findMangaVolumes(mangaId: string): Promise<Volume[]> {
  const response = await mangadexClient.get<MangadexAggregate>(
    `/manga/${mangaId}/aggregate?translatedLanguage[]=pt-br`,
    {}
  )

  return formatVolumes(response.data.volumes)
}

export async function findMangaChapters(chapterId: string): Promise<Chapter> {
  const response: MangadexApiReponse<MangadexChapter> =
    await mangadexClient.get(`/at-home/server/${chapterId}`)

  return {
    id: chapterId,
    host: response.data.baseUrl,
    chapterHash: response.data.chapter.hash,
    data: response.data.chapter.data,
    dataSaver: response.data.chapter.dataSaver
  }
}
