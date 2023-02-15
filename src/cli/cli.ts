import { prompt } from 'enquirer'

import { findMangaById, findMangaByTitle } from '../manga'
import { ConfirmMangaSelectionEnum } from '../models/enums'
import type {
  Manga,
  MangadexApiReponse,
  MangaSearchMethod
} from '../models/interfaces'
import { mangaSearchMethodOptions } from './options'
import { findSelectedMangaInfo, formatChoicesToPrompt } from '../utils/mangadex'

export async function cli(): Promise<void> {
  let continueSearch = true
  let downloadManga = false

  while (continueSearch) {
    const searchMethod = await getSearchMethod()
    const mangaNameOrId = await getMangaNameOrId(searchMethod)

    let mangaConfirmed = false

    let currentPage = 0
    // let mangaInfo: Manga

    while (!mangaConfirmed) {
      const mangaSearchResult = await findManga(mangaNameOrId, currentPage)

      // mangaInfo = mangaSearchResult.mangaInfo
      currentPage = mangaSearchResult.currentPage

      const mangaSelectionConfirmation = await confirmMangaSelection()

      mangaConfirmed = mangaSelectionConfirmation.mangaConfirmed
      continueSearch = mangaSelectionConfirmation.continueSearch

      downloadManga = mangaConfirmed && !continueSearch
    }
  }

  if (downloadManga) {
    // TODO: Download manga
    console.log('Download manga')
  }
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

async function findManga(
  mangaNameOrId: string,
  page?: number
): Promise<{ mangaInfo: Manga; currentPage: number; mangaTitle: string }> {
  const isUuid = mangaNameOrId.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  )

  let mangaInfo: Manga
  let currentPage = 0
  let mangaTitle = ''

  if (isUuid) {
    mangaInfo = (await findMangaById(mangaNameOrId)).data
  } else {
    const mangaListResponse = await findMangaByTitle(mangaNameOrId, page)
    const selectedMangaInfo = await getSelectedMangaInfo(
      mangaListResponse,
      mangaNameOrId
    )

    mangaInfo = selectedMangaInfo.mangaInfo
    currentPage = selectedMangaInfo.currentPage
    mangaTitle = selectedMangaInfo.mangaTitle
  }

  return { mangaInfo, currentPage, mangaTitle }
}

async function getSelectedMangaInfo(
  mangaListResponse: MangadexApiReponse<Manga[]>,
  mangaTitle: string
): Promise<{ mangaInfo: Manga; currentPage: number; mangaTitle: string }> {
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

  return { mangaInfo, currentPage: page, mangaTitle }
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

async function confirmMangaSelection(): Promise<{
  continueSearch: boolean
  mangaConfirmed: boolean
}> {
  const { confirm }: { confirm: ConfirmMangaSelectionEnum } = await prompt({
    type: 'select',
    name: 'confirm',
    message: 'Do you want to download this manga?',
    choices: [
      ConfirmMangaSelectionEnum.CONFIRM_DOWNLOAD,
      ConfirmMangaSelectionEnum.SEARCH_AGAIN,
      ConfirmMangaSelectionEnum.CANCEL
    ]
  })

  switch (confirm) {
    case ConfirmMangaSelectionEnum.CONFIRM_DOWNLOAD:
      return {
        continueSearch: false,
        mangaConfirmed: true
      }
    case ConfirmMangaSelectionEnum.SEARCH_AGAIN:
      return {
        continueSearch: true,
        mangaConfirmed: true
      }
    default:
      return {
        continueSearch: false,
        mangaConfirmed: false
      }
  }
}
