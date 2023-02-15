import { prompt } from 'enquirer'
import { findMangaById, findMangaByTitle } from '../manga'
import type {
  Manga,
  MangadexApiReponse,
  MangaSearchMethod
} from '../models/interfaces'
import { formatChoicesToPrompt } from '../utils/mangadex'

import { mangaSearchMethodOptions } from './options'

export async function cli(): Promise<void> {
  const searchMethod = await getSearchMethod()
  const mangaNameOrId = await getMangaNameOrId(searchMethod)

  await findManga(mangaNameOrId)
}

async function getSearchMethod(): Promise<MangaSearchMethod> {
  const { choice } = await prompt<{ choice: MangaSearchMethod }>({
    type: 'select',
    name: 'choice',
    message: 'Select the search method you want to use:',
    choices: mangaSearchMethodOptions
  })

  return choice
}

async function getMangaNameOrId(
  searchMethod: MangaSearchMethod
): Promise<string> {
  const { manga } = await prompt<{ manga: string }>({
    type: 'input',
    name: 'manga',
    message: `Enter the ${searchMethod} of the manga:`
  })

  return manga
}

async function findManga(mangaNameOrId: string): Promise<void> {
  const isUuid = mangaNameOrId.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  )

  let mangaInfo: Manga

  if (isUuid) {
    mangaInfo = (await findMangaById(mangaNameOrId)).data
  } else {
    const mangaListResponse = await findMangaByTitle(mangaNameOrId)
    mangaInfo = await getSelectedMangaInfo(mangaListResponse, mangaNameOrId)
  }

  console.log(mangaInfo)
}

// Not working :( 😥
export async function getSelectedMangaInfo(
  mangas: MangadexApiReponse<Manga[]>,
  searchName: string
): Promise<Manga> {
  const { page, total, choices } = formatChoicesToPrompt(mangas)

  let choice = ''

  while (choice === '') {
    choice = await promptMangaChoices({ page, total, choices })

    if (choice === 'Próxima página' || choice === 'Página anterior') {
      const newPage = choice === 'Próxima página' ? page + 1 : page - 1
      mangas = await findMangaByTitle(searchName, newPage)
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

async function promptMangaChoices({
  page,
  total,
  choices
}: {
  page: number
  total: number
  choices: string[]
}): Promise<string> {
  const result = await prompt<{ choice: string }>({
    type: 'select',
    name: 'choice',
    message: `Mangas found: Page ${page} of ${total}`,
    choices
  })

  return result.choice
}
