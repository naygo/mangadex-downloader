import axios, { type AxiosInstance } from 'axios'
import * as http from 'http'

import { type MangadexApiReponse } from '../models/interfaces/api'
import { type Manga } from '../models/interfaces/manga'

export class MangaDex {
  private readonly mangadexClient: AxiosInstance
  private readonly mangadexUploadClient: AxiosInstance

  constructor() {
    this.mangadexClient = axios.create({
      baseURL: 'https://api.mangadex.org',
      httpAgent: new http.Agent({ keepAlive: true })
    })

    this.mangadexUploadClient = axios.create({
      baseURL: 'http://uploads.mangadex.org',
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        Connection: 'Keep-Alive'
      }
    })
  }

  async findByTitle(
    title: string,
    page?: number
  ): Promise<MangadexApiReponse<Manga[]>> {
    const response: { data: MangadexApiReponse<Manga[]> } =
      await this.mangadexClient.get('/manga', {
        params: {
          title,
          offset: page,
          'order[relevance]': 'desc'
        }
      })

    return response.data
  }

  async findById(id: string): Promise<MangadexApiReponse<Manga>> {
    const response: { data: MangadexApiReponse<Manga> } =
      await this.mangadexClient.get(`/manga/${id}`)

    return response.data
  }
}
