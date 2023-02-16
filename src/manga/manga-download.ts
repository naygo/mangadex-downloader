import 'dotenv/config'

import type { Cover, Chapter } from '@/models/interfaces'
import { getAllMangaCovers } from '@/utils/mangadex'
import { retry } from '@lifeomic/attempt'
import { type AxiosResponse } from 'axios'
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  unlink,
  writeFileSync
} from 'fs'
import sizeOf from 'image-size'
import { basename, join, resolve } from 'path'
import PDFDocument from 'pdfkit'
import {
  findMangaChapters,
  findMangaVolumes,
  getMangaVolumeCoverBuffer
} from './mangadex-api-data'
import { mangadexUploadClient } from './mangadex-clients'
import JSZip from 'jszip'
import { StoreConfigMangaEnum } from '@/models/enums'
import { convertToMobi } from '@/utils/convert-to-mobi'
import { createVolumeFolder } from './file'

interface DownloadImagesResponse {
  path: string
  page: string
  response: AxiosResponse<Buffer, any>
}

let folderPath = ''
const showLogs = process.env.SHOW_LOGS === 'true'

function createDestinationFolder(mangaName: string): void {
  const dirPath = process.env.DOWNLOAD_FOLDER as string
  if (!dirPath) throw new Error('DOWNLOAD_FOLDER is not defined in .env file')

  const newFolderPath = join(dirPath, mangaName)
  if (!existsSync(newFolderPath)) mkdirSync(newFolderPath, { recursive: true })
  folderPath = resolve(newFolderPath)
}

export async function mangaDownload(
  mangaId: string,
  mangaName: string,
  storeConfig: StoreConfigMangaEnum
): Promise<void> {
  createDestinationFolder(mangaName)

  const volumes = await findMangaVolumes(mangaId)
  const covers = await getAllMangaCovers(mangaId)
  const volumesPath: string[] = []

  console.log(`🟢 \x1b[32mDOWNLOADING ${volumes.length} VOLUMES\x1b[0m`)

  for (const volume of volumes) {
    if (volume.volume === 'none') {
      volume.volume = 'Unreleased'
    }

    if (storeConfig === StoreConfigMangaEnum.MOBI) {
      folderPath = createVolumeFolder(volume.volume, folderPath)
    }

    console.log('\x1b[37m-------------------------\x1b[0m')
    console.log(
      `🔹 \x1b[36mVol. ${volume.volume}\x1b[0m - \x1b[33m${volume.chapters.length} chapters\x1b[0m`
    )

    const chaptersImagesPath: string[] = []
    const volumeCover = getVolumeCover(covers, volume.volume)

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
        await createChapterPDF(chaptersImagesPath, mangaName, volume.volume)
        break
      case StoreConfigMangaEnum.MOBI:
        await convertToMobi(folderPath, `${mangaName} - Vol. ${volume.volume}`)
        break
      case StoreConfigMangaEnum.ZIP:
        await generateZip(mangaName, volumesPath)
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

function getVolumeCover(covers: Cover[], volume: string): Cover | undefined {
  return covers.find((cover) => cover.volume === volume)
}

async function downloadAndSaveCover(
  mangaId: string,
  fileName: string
): Promise<string> {
  const imageBuffer = await getMangaVolumeCoverBuffer(mangaId, fileName)

  const coverPath = join(folderPath, '_cover.jpg')

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

async function findImage(url: string): Promise<AxiosResponse<Buffer, any>> {
  return await retry(async () => await mangadexUploadClient(url), {
    delay: 200,
    factor: 2,
    maxAttempts: 10,
    handleError: (_, ctx) => {
      showLogs &&
        console.log(
          `im erroring bro :( (${String(ctx.attemptNum)} attempts, ${String(
            ctx.attemptsRemaining
          )} remaining)`
        )
    }
  })
}

async function createChapterPDF(
  chaptersImagesPath: string[],
  mangaName: string,
  volume: string
): Promise<string> {
  console.log('📃 Creating PDF...')

  const mangaPDF = new PDFDocument({
    autoFirstPage: false,
    compress: true
  })

  const fileName = `${mangaName} - Vol. ${volume}.pdf`
  const filePath = resolve(folderPath, fileName)
  mangaPDF.pipe(createWriteStream(filePath))

  for (const imagePath of chaptersImagesPath) {
    showLogs && console.log(`Adding page ${imagePath}`)
    const dimensions = sizeOf(imagePath)

    if (!dimensions.width || !dimensions.height) {
      throw new Error('Image dimensions not found')
    }

    mangaPDF
      .addPage({
        size: [dimensions.width, dimensions.height],
        margin: 0
      })
      .image(imagePath, 0, 0, {
        fit: [dimensions.width, dimensions.height],
        align: 'center',
        valign: 'center'
      })

    unlink(imagePath, (err) => {
      if (err) throw err
    })
  }

  mangaPDF.end()
  return filePath
}

async function generateZip(
  mangaName: string,
  volumesPath: string[]
): Promise<void> {
  console.log('🔒 Creating ZIP...')

  const zip = new JSZip()
  const zipFolder = zip.folder(mangaName)

  for (const volumePath of volumesPath) {
    const volumeName = basename(volumePath)
    zipFolder?.file(volumeName, readFileSync(volumePath))

    unlink(volumePath, (err) => {
      if (err) throw err
    })
  }

  await zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
    const zipPath = resolve(folderPath, `${mangaName}.zip`)
    writeFileSync(zipPath, content)
  })

  console.log('✅ \x1b[32mZIP created!\x1b[0m')
}
