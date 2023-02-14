import { prompt } from 'enquirer'
import { choicesSearchManga } from './utils/choices-search-manga'

interface TypeSearchManga {
  manga: string
  type: 'name' | 'id'
}

export async function readUserManga (): Promise<TypeSearchManga> {
  const choice: { choice: TypeSearchManga['type'] } = await prompt({
    type: 'select',
    name: 'choice',
    message: 'Selecione o modo que deseja pesquisar o mangá:',
    choices: choicesSearchManga
  })

  const { manga } = await prompt<TypeSearchManga>({
    type: 'input',
    name: 'manga',
    message: `Digite o ${choice.choice} do mangá:`
  })

  return { manga, type: choice.choice }
}
