import { prompt } from 'enquirer'
import { findMangaById, findMangaByTitle } from '../manga'
import type {
  Manga,
  MangadexApiReponse,
  MangaSearchMethod
} from '../models/interfaces'
import {
  findSelectedMangaInfo,
  formatChoicesToPrompt,
  showMangaInfo
} from '../utils/mangadex'

import { mangaSearchMethodOptions } from './options'

export async function cli(): Promise<void> {
  const searchMethod = await getSearchMethod()
  const mangaNameOrId = await getMangaNameOrId(searchMethod)

  const selectedManga = await findManga(mangaNameOrId)

  showMangaInfo(selectedManga)
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

async function findManga(mangaNameOrId: string): Promise<Manga> {
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

  return mangaInfo
}

export async function getSelectedMangaInfo(
  mangaListResponse: MangadexApiReponse<Manga[]>,
  mangaTitle: string
): Promise<Manga> {
  let page = 0
  let mangaList = mangaListResponse
  let choice = ''
  let hasNextOrPrevPage = true

  while (hasNextOrPrevPage) {
    const { choices, currentPage, totalPages } =
      formatChoicesToPrompt(mangaList)

    const { choice: selectedChoice } = await promptMangaChoices(
      choices,
      currentPage,
      totalPages
    )

    if (selectedChoice === 'Next page') {
      page = currentPage + 1
      mangaList = await findMangaByTitle(mangaTitle, page)
    } else if (selectedChoice === 'Previous page') {
      page = currentPage - 1
      mangaList = await findMangaByTitle(mangaTitle, page)
    } else {
      choice = selectedChoice
      hasNextOrPrevPage = false
    }

    console.clear()
  }

  const mangaInfo = findSelectedMangaInfo(mangaList, choice)

  if (mangaInfo == null) throw new Error('Manga not found')

  return mangaInfo
}

async function promptMangaChoices(
  choices: string[],
  currentPage: number,
  totalPages: number
): Promise<{ choice: string }> {
  return await prompt<{ choice: string }>({
    type: 'select',
    name: 'choice',
    message: `Mangas found: Page ${currentPage + 1} of ${totalPages}`,
    choices
  })
}
