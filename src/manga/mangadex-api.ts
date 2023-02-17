import 'dotenv/config'

import axios, { AxiosResponse } from 'axios'
import * as http from 'http'
import {
  Chapter,
  Cover,
  Manga,
  MangadexApiReponse,
  MangadexChapter,
  MangaDexResponse
} from '@/models/interfaces'
import { MangadexAggregate, Volume } from '@/models/interfaces'
import { formatVolumes } from '@/utils'
import { retry } from '@lifeomic/attempt'

const showLogs = process.env.SHOW_LOGS === 'true'

export const mangadexClient = axios.create({
  baseURL: 'https://api.mangadex.org',
  httpAgent: new http.Agent({ keepAlive: true })
})

export const mangadexUploadClient = axios.create({
  baseURL: 'http://uploads.mangadex.org',
  responseType: 'arraybuffer',
  timeout: 30000,
  headers: {
    Connection: 'Keep-Alive'
  }
})

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

export async function getMangaVolumeCoverBuffer(
  mangaId: string,
  filename: string
): Promise<Buffer> {
  const response = await mangadexUploadClient.get(
    `/covers/${mangaId}/${filename}`,
    {
      responseType: 'arraybuffer'
    }
  )

  return response.data
}

export async function findMangaVolumes(
  mangaId: string,
  language: string
): Promise<Volume[]> {
  const response = await mangadexClient.get<MangadexAggregate>(
    `/manga/${mangaId}/aggregate?translatedLanguage[]=${language}`,
    {}
  )

  return formatVolumes(response.data.volumes)
}

export async function findImage(
  url: string
): Promise<AxiosResponse<Buffer, any>> {
  return await retry(async () => await mangadexUploadClient(url), {
    delay: 200,
    factor: 2,
    maxAttempts: 10,
    handleError: (_, ctx) => {
      showLogs &&
        console.log(
          `im erroring bro :( (${String(ctx.attemptNum)} attempts, ${String(
            ctx.attemptsRemaining
          )} remaining)`
        )
    }
  })
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
