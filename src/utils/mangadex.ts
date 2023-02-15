import type { Manga, MangadexApiReponse } from '../models/interfaces'

export function formatChoicesToPrompt(
  mangaListResponse: MangadexApiReponse<Manga[]>
): { page: number; total: number; choices: string[] } {
  const { offset = 0, total } = mangaListResponse
  const page = offset != null ? offset : 0

  const mangaList = mangaListResponse.data

  const mangaTitles = mangaList
    .map((manga) => manga.attributes.title.en || manga.attributes.title.ja)
    .filter((title) => title != null)

  const choices = [
    ...mangaTitles,
    ...(total > 10 && offset > 0 ? ['Previous page'] : []),
    ...(total > 10 && offset < total ? ['Next page'] : [])
  ]

  return {
    page,
    total,
    choices
  }
}
