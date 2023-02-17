import { prompt } from 'enquirer'

import { findMangaById, findMangaByTitle } from '@/manga'
import { ConfirmMangaSelectionEnum, StoreConfigMangaEnum } from '@/models/enums'
import type {
  Manga,
  MangadexApiReponse,
  MangaSearchMethod
} from '@/models/interfaces'
import {
  findSelectedMangaInfo,
  formatChoicesToPrompt,
  showMangaInfo
} from '@/utils/mangadex'
import { mangaDownload } from '@/manga/manga-download'

export async function cli(): Promise<void> {
  let continueSearch = true
  let mangaInfo: Manga | null = null

  while (continueSearch) {
    const mangaNameOrId = await getMangaNameOrId()

    let mangaConfirmed = false

    let currentPage = 0

    while (!mangaConfirmed) {
      const mangaSearchResult = await findManga(mangaNameOrId, currentPage)

      currentPage = mangaSearchResult.currentPage
      mangaInfo = mangaSearchResult.mangaInfo

      const mangaSelectionConfirmation = await confirmMangaSelection(mangaInfo)

      mangaConfirmed = mangaSelectionConfirmation.mangaConfirmed
      continueSearch = mangaSelectionConfirmation.continueSearch
    }
  }

  if (!mangaInfo) throw new Error('Manga info not defined')

  const storeConfig = await getStoreConfigManga()

  await mangaDownload(mangaInfo.id, mangaInfo.attributes.title.en, storeConfig)
}

async function getMangaNameOrId(): Promise<string> {
  console.clear()

  const { manga } = await prompt<{ manga: string }>({
    type: 'input',
    name: 'manga',
    message: 'Enter the Name or the UUID (mangadex) of the manga:'
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
      mangaTitle,
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
  }

  const mangaInfo = findSelectedMangaInfo(mangaList, choice)

  if (mangaInfo == null) throw new Error('Manga not found')

  return { mangaInfo, currentPage: page, mangaTitle }
}

async function promptMangaChoices(
  mangaTitle: string,
  choices: string[],
  currentPage: number,
  totalPages: number
): Promise<{ choice: string }> {
  console.clear()
  console.log(`Entered title: \x1b[33m${mangaTitle}\x1b[0m`)

  return await prompt<{ choice: string }>({
    type: 'select',
    name: 'choice',
    message: `Mangas found: Page ${currentPage + 1} of ${totalPages}`,
    choices
  })
}

async function confirmMangaSelection(mangaInfo: Manga): Promise<{
  continueSearch: boolean
  mangaConfirmed: boolean
}> {
  showMangaInfo(mangaInfo)

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

async function getStoreConfigManga(): Promise<StoreConfigMangaEnum> {
  console.clear()

  const { store }: { store: StoreConfigMangaEnum } = await prompt({
    type: 'select',
    name: 'store',
    message: 'How do you want to store the manga?',
    choices: [
      StoreConfigMangaEnum.PDF,
      StoreConfigMangaEnum.ZIP,
      StoreConfigMangaEnum.MOBI
    ]
  })

  return store
}
