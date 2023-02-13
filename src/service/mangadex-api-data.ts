import axios from 'axios'
import type { AxiosInstance } from 'axios'
import * as http from 'http'

export const mangadexClient: AxiosInstance = axios.create({
  baseURL: 'https://api.mangadex.org',
  httpAgent: new http.Agent({ keepAlive: true })
})

export const mangadexUploadClient: AxiosInstance = axios.create({
  baseURL: 'http://uploads.mangadex.org',
  responseType: 'arraybuffer',
  timeout: 30000,
  headers: {
    Connection: 'Keep-Alive'
  }
})
