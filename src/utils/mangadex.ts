import type { Manga, MangadexApiReponse } from '../models/interfaces'

export function formatChoicesToPrompt(
  mangaListResponse: MangadexApiReponse<Manga[]>
): { currentPage: number; totalPages: number; choices: string[] } {
  const { offset = 0, data, total = 0 } = mangaListResponse

  const currentPage = offset / 10
  const totalPages = Math.ceil(total / 10)

  const mangaTitles = new Set(
    data
      .map(({ attributes }) => attributes.title?.en || attributes.title?.ja)
      .filter(Boolean)
  )

  const hasPreviousPage = offset > 0
  const hasNextPage = currentPage + 1 < totalPages

  const choices = [
    ...mangaTitles,
    hasPreviousPage ? 'Previous page' : '',
    hasNextPage ? 'Next page' : ''
  ].filter(Boolean) // Remove possible falsy values

  return {
    currentPage,
    totalPages,
    choices
  }
}

export function findSelectedMangaInfo(
  mangaList: MangadexApiReponse<Manga[]>,
  choice: string
): Manga | null {
  return (
    mangaList.data.find(
      (manga) =>
        manga.attributes.title.en === choice ||
        manga.attributes.title.ja === choice
    ) ?? null
  )
}
