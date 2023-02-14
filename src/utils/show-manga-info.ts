import type { Manga } from '../models/interfaces/manga'

export function showMangaInfo(manga: Manga): void {
  const { title, description, tags } = manga.attributes
  const { en } = description

  const tagsFormatted = tags.map((tag) => tag.attributes.name.en)

  console.log(`Título: \x1b[33m${title.en}\x1b[0m`)
  console.log(`Descrição: \x1b[32m${en}\x1b[0m`)
  console.log(`Tags: \x1b[36m${tagsFormatted.join(', ')}\x1b[0m`)
}
