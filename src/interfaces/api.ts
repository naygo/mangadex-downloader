export interface MangadexApiReponse<T> {
  result: string
  response: string
  data: T
  limit: number
  total: number
  offset?: number
}
