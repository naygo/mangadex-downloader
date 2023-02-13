import { prompt } from 'enquirer'

const getMangaName = async (): Promise<string> => {
  const result: { name: string } = await prompt({
    type: 'input',
    name: 'name',
    message: 'Digite o nome do mangá:'
  })

  return result.name
}

await (async (): Promise<void> => {
  const mangaName = await getMangaName()
  console.log(mangaName)
})()
