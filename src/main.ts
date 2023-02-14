import { downloadManga } from './download-manga'
import { getUserManga } from './manga-info'

const main = async (): Promise<void> => {
  const mangaInfo = await getUserManga()
  console.log(mangaInfo)

  downloadManga()
}

void main()
