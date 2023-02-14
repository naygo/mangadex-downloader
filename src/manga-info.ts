import type { Manga } from './models/interfaces/manga'

import { showMangaInfo } from './utils/show-manga-info'
import { readUserManga } from './read-user-manga'
import { ChoiceEnum } from './models/enums/choice'
import { getSelectedMangaInfo } from './list-mangas'
import { prompt } from 'enquirer'
import { MangaDex } from './classes'

const mangadex = new MangaDex()

export async function getUserManga(): Promise<Manga | null> {
  try {
    const mangaInfo = await getMangaInfo()
    const confirmDownload = await confirmMangaSelection()

    switch (confirmDownload) {
      case ChoiceEnum.YES:
        console.log('Baixando mangá...')
        return mangaInfo
      case ChoiceEnum.SEARCH_AGAIN:
        console.log('Buscando novamente...')
        await getUserManga()
        break
      case ChoiceEnum.CANCEL:
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
  let mangaInfo: Manga | null = null
  const searchManga = await readUserManga()

  if (searchManga.type === 'name') {
    mangaInfo = await getMangaByName(searchManga.manga)
  } else {
    mangaInfo = (await mangadex.findById(searchManga.manga)).data
  }

  if (mangaInfo == null) {
    console.log('Manga não encontrado')
    return null
  }

  showMangaInfo(mangaInfo)
  return mangaInfo
}

async function getMangaByName(mangaName: string): Promise<Manga> {
  const mangasFound = await mangadex.findByTitle(mangaName)
  const mangaInfo = await getSelectedMangaInfo(mangasFound, mangaName)

  if (mangaInfo == null) throw new Error('Manga não encontrado')

  return mangaInfo
}

async function confirmMangaSelection(): Promise<ChoiceEnum> {
  const { confirm }: { confirm: ChoiceEnum } = await prompt({
    type: 'select',
    name: 'confirm',
    message: 'Deseja baixar o mangá?',
    choices: [ChoiceEnum.YES, ChoiceEnum.SEARCH_AGAIN, ChoiceEnum.CANCEL]
  })

  return confirm
}
