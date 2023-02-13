import { prompt } from 'enquirer'
import { searchMangasByName } from './service/mangadex-client'

import type { MangadexApiReponse } from './interfaces/api'
import type { Manga } from './interfaces/manga'

const getMangaName = async (): Promise<string> => {
  const result: { name: string } = await prompt({
    type: 'input',
    name: 'name',
    message: 'Digite o nome do mangá:'
  })

  return result.name
}

const listMangasAndGetChoice = async (mangas: MangadexApiReponse<Manga[]>, searchName: string): Promise<Manga> => {
  let choice = ''
  while (choice === '') {
    const { offset, total } = mangas
    const page = (offset != null) ? offset : 0

    const choices = [
      ...mangas.data.map(manga => manga.attributes.title.en).filter(manga => manga != null),
      ...(total > 10 && page > 0) ? ['Página anterior'] : [],
      ...(total > 10 && page < total) ? ['Próxima página'] : []
    ]

    const result = await prompt<{ choice: string }>({
      type: 'select',
      name: 'choice',
      message: `Selecione o mangá: Página ${page} de ${total}`,
      choices
    })
    choice = result.choice

    if (choice === 'Próxima página' || choice === 'Página anterior') {
      const newPage = (choice === 'Próxima página') ? page + 1 : page - 1
      mangas = await searchMangasByName(searchName, newPage)
      choice = ''
    }

    console.clear()
  }

  const mangaInfo = mangas.data.find(manga => manga.attributes.title.en === choice)
  if (mangaInfo == null) throw new Error('Manga não encontrado')

  return mangaInfo
}

const showMangaInfo = async (manga: Manga): Promise<void> => {
  const { title, description, tags } = manga.attributes
  const { en } = description

  const tagsFormatted = tags.map(tag => tag.attributes.name.en)

  console.log(`Título: \x1b[33m${title.en}\x1b[0m`)
  console.log(`Descrição: \x1b[32m${en}\x1b[0m`)
  console.log(`Tags: \x1b[36m${tagsFormatted.join(', ')}\x1b[0m`)
}

const confirmMangaSelection = async (): Promise<ChoiceEnum> => {
  const { confirm }: { confirm: ChoiceEnum } = await prompt({
    type: 'select',
    name: 'confirm',
    message: 'Deseja baixar o mangá?',
    choices: [ChoiceEnum.YES, ChoiceEnum.SEARCH, ChoiceEnum.CANCEL]
  })

  return confirm
}

const pageStorage = 0 // store page number to use to return to the same page
const showAndGetSearchedMangaInfo = async (searchName: string): Promise<Manga> => {
  const mangas = await searchMangasByName(searchName, pageStorage)
  const mangaInfo = await listMangasAndGetChoice(mangas, searchName)

  await showMangaInfo(mangaInfo)
  return mangaInfo
}

const main = async (): Promise<void> => {
  try {
    let mangaId = ''

    while (mangaId === '') {
      console.clear()

      const searchName = await getMangaName()
      const mangaInfo = await showAndGetSearchedMangaInfo(searchName)
      const confirm = await confirmMangaSelection()

      if (confirm === ChoiceEnum.CANCEL) {
        console.log('Cancelado')
        return
      }

      if (confirm === ChoiceEnum.SEARCH) {
        continue
      }

      mangaId = mangaInfo.id
    }

    console.log('Fim')
  } catch (error) {
    console.log(error)
  }
}

enum ChoiceEnum {
  YES = '👍 Sim',
  SEARCH = '🔎 Pesquisar outro mangá',
  CANCEL = '❌ Cancelar',
}

void main()
