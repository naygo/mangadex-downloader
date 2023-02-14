import { prompt } from 'enquirer'
import { MangaDex } from './classes'
import type { MangadexApiReponse } from './models/interfaces/api'
import type { Manga } from './models/interfaces/manga'

const mangadex = new MangaDex()

export function formatChoicesToListMangas(
  mangas: MangadexApiReponse<Manga[]>
): { page: number; total: number; choices: string[] } {
  const { offset, total } = mangas
  const page = offset != null ? offset : 0

  const choices = [
    ...mangas.data
      .map((manga) => manga.attributes.title.en || manga.attributes.title.ja)
      .filter((manga) => manga != null),
    ...(total > 10 && page > 0 ? ['Página anterior'] : []),
    ...(total > 10 && page < total ? ['Próxima página'] : [])
  ]

  return {
    page,
    total,
    choices
  }
}

export async function getSelectedMangaInfo(
  mangas: MangadexApiReponse<Manga[]>,
  searchName: string
): Promise<Manga> {
  const { page, total, choices } = formatChoicesToListMangas(mangas)

  let choice = ''

  while (choice === '') {
    const result = await prompt<{ choice: string }>({
      type: 'select',
      name: 'choice',
      message: `Mangás encontrados: Página ${page} de ${total}`,
      choices
    })
    choice = result.choice

    if (choice === 'Próxima página' || choice === 'Página anterior') {
      const newPage = choice === 'Próxima página' ? page + 1 : page - 1
      mangas = await mangadex.findByTitle(searchName, newPage)
      choice = ''
    }

    console.clear()
  }

  const mangaInfo = mangas.data.find(
    (manga) =>
      manga.attributes.title.en === choice ||
      manga.attributes.title.ja === choice
  )

  if (mangaInfo == null) throw new Error('Manga não encontrado')

  return mangaInfo
}
