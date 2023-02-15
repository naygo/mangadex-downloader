import { getMangaCovers } from '@/manga'
import type { Cover, Manga, MangadexApiReponse } from '@/models/interfaces'

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

export function showMangaInfo(manga: Manga): void {
  const { title, tags, publicationDemographic, status, year } = manga.attributes
  const author = manga.relationships.find(
    (relationship) => relationship.type === 'author'
  )
  const authorName: string = author?.attributes?.name ?? 'Unknown'
  const formattedTags = tags.map((tag) => tag.attributes.name.en).join(', ')

  console.clear()

  console.log(`Title: \x1b[33m${title.en || title.ja}\x1b[0m`)
  console.log(`Author: \x1b[33m${authorName}\x1b[0m`)
  console.log(`Release Date: \x1b[33m${year}\x1b[0m`)
  console.log(`Status: \x1b[33m${status}\x1b[0m`)
  console.log(`Demographic: \x1b[33m${publicationDemographic}\x1b[0m`)
  console.log(`Tags: \x1b[36m${formattedTags}\x1b[0m`)
}

// The mangaDex api only returns 100 results per page
export async function getAllMangaCovers(mangaId: string): Promise<Cover[]> {
  const covers: Cover[] = []

  let offset = 0
  let mangaCoverCount = 0

  do {
    const mangaCoversResponse = await getMangaCovers(mangaId, offset)

    mangaCoverCount = mangaCoversResponse.total

    for (const cover of mangaCoversResponse.data) {
      const { attributes } = cover

      if (attributes.volume === null) continue

      const { volume } = attributes

      if (volume.includes('.')) continue

      covers.push(attributes)
    }

    offset += mangaCoversResponse.limit
  } while (offset < mangaCoverCount)

  return covers
}
