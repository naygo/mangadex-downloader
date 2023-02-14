import { prompt } from 'enquirer'
import type { MangadexApiReponse } from './interfaces/api'
import type { Manga } from './interfaces/manga'
import { findMangasByName } from './service/mangadex-client'

export function formatChoicesToListMangas (
  mangas: MangadexApiReponse<Manga[]>
): { page: number, total: number, choices: string[] } {
  const { offset, total } = mangas
  const page = offset != null ? offset : 0

  return {
    page,
    total,
    choices: [
      ...mangas.data
        .map((manga) => manga.attributes.title.en)
        .filter((manga) => manga != null),
      ...(total > 10 && page > 0 ? ['Página anterior'] : []),
      ...(total > 10 && page < total ? ['Próxima página'] : [])
    ]
  }
}

export async function getSelectedMangaInfo (
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
      mangas = await findMangasByName(searchName, newPage)
      choice = ''
    }

    console.clear()
  }

  const mangaInfo = mangas.data.find(
    (manga) => manga.attributes.title.en === choice
  )
  if (mangaInfo == null) throw new Error('Manga não encontrado')

  return mangaInfo
}
