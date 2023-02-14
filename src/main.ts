import { prompt } from 'enquirer'
import { getMangaById, findMangasByName } from './service/mangadex-client'

import type { Manga } from './interfaces/manga'

import { downloadManga } from './download-manga'

import { showMangaInfo } from './utils/show-manga-info'
import { getSelectedMangaInfo } from './list-mangas'
import { readUserManga } from './read-user-manga'

enum ChoiceEnum {
  YES = '👍 Sim',
  BACK = '🔙 Voltar',
  SEARCH_AGAIN = '🔎 Pesquisar outro mangá',
  CANCEL = '❌ Cancelar'
}

const main = async (): Promise<void> => {
  try {
    let mangaId = ''

    while (mangaId === '' || mangaId !== 'cancel') {
      let mangaInfo: Manga | null = null
      const searchManga = await readUserManga()

      if (searchManga.type === 'name') {
        mangaInfo = await getMangaByName(searchManga.manga)
      } else {
        mangaInfo = (await getMangaById(searchManga.manga)).data
      }

      showMangaInfo(mangaInfo)

      const confirmDownload = await confirmMangaSelection()
      console.log(confirmDownload)
      switch (confirmDownload) {
        case ChoiceEnum.YES:
          console.log('Baixando mangá...')
          mangaId = mangaInfo.id
          break
        case ChoiceEnum.SEARCH_AGAIN:
          console.log('Pesquisando outro mangá...')
          mangaId = ''
          break
        case ChoiceEnum.CANCEL:
          console.log('Cancelando...')
          mangaId = 'cancel'
          break
      }
    }

    if (mangaId !== 'cancel') {
      console.log('Busca cancelada')
    } else {
      downloadManga(mangaId)
    }
  } catch (error) {
    console.log(error)
  }
}

async function getMangaByName (mangaName: string): Promise<Manga> {
  const mangasFounded = await findMangasByName(mangaName)
  const mangaInfo = await getSelectedMangaInfo(mangasFounded, mangaName)

  if (mangaInfo == null) throw new Error('Manga não encontrado')

  return mangaInfo
}

async function confirmMangaSelection (): Promise<ChoiceEnum> {
  const { confirm }: { confirm: ChoiceEnum } = await prompt({
    type: 'select',
    name: 'confirm',
    message: 'Deseja baixar o mangá?',
    choices: [ChoiceEnum.YES, ChoiceEnum.SEARCH_AGAIN, ChoiceEnum.CANCEL]
  })

  return confirm
}

void main()
