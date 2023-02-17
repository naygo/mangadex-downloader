import 'dotenv/config'

import { StoreConfigMangaEnum } from '@/models/enums'
import type { Chapter } from '@/models/interfaces'
import { getAllMangaCovers } from '@/utils/mangadex'
import { type AxiosResponse } from 'axios'
import { existsSync, rmdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  findImage,
  findMangaChapters,
  findMangaVolumes,
  getMangaVolumeCoverBuffer
} from './mangadex-api'
import {
  convertToMobi,
  createChapterPDF,
  createDestinationFolder,
  createVolumeFolder,
  generateZip
} from './file'

interface DownloadImagesResponse {
  path: string
  page: string
  response: AxiosResponse<Buffer, any>
}

let folderPath = ''
const showLogs = process.env.SHOW_LOGS === 'true'

export async function mangaDownload(
  mangaId: string,
  mangaName: string,
  storeConfig: StoreConfigMangaEnum
): Promise<void> {
  folderPath = createDestinationFolder(mangaName)

  const volumes = await findMangaVolumes(mangaId)
  const covers = await getAllMangaCovers(mangaId)

  const volumesPath: string[] = []

  console.log(`🟢 \x1b[32mDOWNLOADING ${volumes.length} VOLUMES\x1b[0m`)

  for (const volume of volumes) {
    if (volume.volume === 'none') {
      volume.volume = 'Unreleased'
    }

    console.log('\x1b[37m-------------------------\x1b[0m')
    console.log(
      `🔹 \x1b[36mVol. ${volume.volume}\x1b[0m - \x1b[33m${volume.chapters.length} chapters\x1b[0m`
    )

    const chaptersImagesPath: string[] = []
    const volumeCover = covers.find((cover) => cover.volume === volume.volume)

    if (volumeCover) {
      const coverPath = await downloadAndSaveCover(
        mangaId,
        volumeCover?.fileName
      )

      chaptersImagesPath.push(coverPath)
    }

    for (const [index, chapter] of volume.chapters.entries()) {
      showLogs && console.log('Downloading chapter: ', chapter.chapter)
      const chapterData = await findMangaChapters(chapter.id)
      // TODO - add verification of exceptions
      chaptersImagesPath.push(...(await downloadChapter(chapterData, index)))
    }

    verifyIfAllChapterWereDownloaded(chaptersImagesPath)

    switch (storeConfig) {
      case StoreConfigMangaEnum.PDF:
        await createChapterPDF(
          chaptersImagesPath,
          mangaName,
          volume.volume,
          folderPath
        )
        break
      case StoreConfigMangaEnum.MOBI:
        if (folderPath.includes('Vol.')) {
          folderPath = folderPath.split(`${mangaName} - Vol.`)[0]
        }

        folderPath = createVolumeFolder(mangaName, volume.volume, folderPath)

        await convertToMobi({
          inputFile: folderPath,
          mangaName: `${mangaName} - Vol. ${volume.volume}`,
          outputDir: join(process.env.DOWNLOAD_FOLDER as string, mangaName)
        })

        rmdirSync(folderPath, { recursive: true })

        break
      case StoreConfigMangaEnum.ZIP:
        await generateZip(mangaName, volumesPath, folderPath)
        break
      default:
        break
    }

    console.log(`✅ \x1b[32mVolume ${volume.volume} downloaded!\x1b[0m`)
  }

  showLogs && console.log('Done! :D')
}

function verifyIfAllChapterWereDownloaded(chaptersImagesPath: string[]): void {
  showLogs && console.log('Total pages: ', chaptersImagesPath.length)
  const notDownloaded = chaptersImagesPath.filter((path) => !existsSync(path))
  showLogs && console.log('Not downloaded: ', notDownloaded.length)
}

async function downloadAndSaveCover(
  mangaId: string,
  fileName: string
): Promise<string> {
  const imageBuffer = await getMangaVolumeCoverBuffer(mangaId, fileName)

  const coverPath = join(folderPath, 'a_cover.jpg')

  writeFileSync(coverPath, imageBuffer)

  return coverPath
}

async function downloadChapter(
  chapterData: Chapter,
  chapter: number
): Promise<string[]> {
  const { data, chapterHash } = chapterData
  const chapterImagesPath: string[] = []

  let count = 1

  const responses: DownloadImagesResponse[] = await Promise.all(
    data.map(async (page) => {
      showLogs && console.log(`Downloading ${page}`)

      const pageUrl = `data/${chapterHash}/${page}`
      const pagePath = join(
        folderPath,
        `chapter ${chapter} - page ${count}.jpg`
      )

      chapterImagesPath.push(pagePath)
      count++

      return {
        path: pagePath,
        page,
        response: await findImage(pageUrl)
      }
    })
  )

  for (const image of responses) {
    writeFileSync(image.path, image.response.data)
  }

  return chapterImagesPath
}
