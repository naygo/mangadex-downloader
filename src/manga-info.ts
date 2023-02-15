import type { Manga } from './models/interfaces/manga'

import { readUserManga } from './read-user-manga'
import { ConfirmMangaSelectionEnum } from './models/enums/choices'
import { getSelectedMangaInfo } from './list-mangas'
import { prompt } from 'enquirer'
import { findMangaById, findMangaByTitle } from './manga/mangadex-api-data'
import { showMangaInfo } from './utils/mangadex'

export async function getUserManga(): Promise<Manga | null> {
  try {
    const mangaInfo = await getMangaInfo()
    const confirmDownload = await confirmMangaSelection()

    switch (confirmDownload) {
      case ConfirmMangaSelectionEnum.CONFIRM_DOWNLOAD:
        console.log('Baixando mangá...')
        return mangaInfo
      case ConfirmMangaSelectionEnum.SEARCH_AGAIN:
        console.log('Buscando novamente...')
        await getUserManga()
        break
      case ConfirmMangaSelectionEnum.CANCEL:
        console.log('Cancelando...')
        break
    }

    return null
  } catch (error) {
    console.log(error)
    return null
  }
}

async function getMangaInfo(): Promise<Manga | null> {
  const searchManga = await readUserManga()

  let mangaInfo: Manga | null = null

  if (searchManga.type === 'name') {
    mangaInfo = await getMangaByName(searchManga.manga)
  } else {
    mangaInfo = (await findMangaById(searchManga.manga)).data
  }

  if (mangaInfo == null) {
    console.log('Manga não encontrado')
    return null
  }

  showMangaInfo(mangaInfo)
  return mangaInfo
}

async function getMangaByName(mangaName: string): Promise<Manga> {
  const mangasFound = await findMangaByTitle(mangaName)
  const mangaInfo = await getSelectedMangaInfo(mangasFound, mangaName)

  if (mangaInfo == null) throw new Error('Manga não encontrado')

  return mangaInfo
}

async function confirmMangaSelection(): Promise<ConfirmMangaSelectionEnum> {
  const { confirm }: { confirm: ConfirmMangaSelectionEnum } = await prompt({
    type: 'select',
    name: 'confirm',
    message: 'Deseja baixar o mangá?',
    choices: [
      ConfirmMangaSelectionEnum.CONFIRM_DOWNLOAD,
      ConfirmMangaSelectionEnum.SEARCH_AGAIN,
      ConfirmMangaSelectionEnum.CANCEL
    ]
  })

  return confirm
}
