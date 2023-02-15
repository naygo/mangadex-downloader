import { cli } from './cli'

const main = async (): Promise<void> => {
  /*
  const mangaInfo = await getUserManga()
  console.log(mangaInfo)

  if (mangaInfo == null) {
    console.log('Manga não encontrado')
    return
  }

  // TODO - get volumes and chapters to download
  downloadManga(mangaInfo.id)
  // TODO - images to pdf
  // TODO - pdf to MOBI
  */

  // Refactoring
  await cli()
}

void main()
