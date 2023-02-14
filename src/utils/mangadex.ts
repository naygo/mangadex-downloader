import axios from 'axios'
import * as http from 'http'

import { type Manga, type MangadexApiReponse } from '../models/interfaces'

const mangadexClient = axios.create({
  baseURL: 'https://api.mangadex.org',
  httpAgent: new http.Agent({ keepAlive: true })
})

const mangadexUploadClient = axios.create({
  baseURL: 'http://uploads.mangadex.org',
  responseType: 'arraybuffer',
  timeout: 30000,
  headers: {
    Connection: 'Keep-Alive'
  }
})

export async function findMangaByTitle(
  title: string,
  page?: number
): Promise<MangadexApiReponse<Manga[]>> {
  const response: { data: MangadexApiReponse<Manga[]> } =
    await mangadexClient.get('/manga', {
      params: {
        title,
        offset: page,
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
