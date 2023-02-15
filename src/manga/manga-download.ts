import 'dotenv/config'
import { retry } from '@lifeomic/attempt'
import { createWriteStream, existsSync, mkdirSync, unlink, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { findMangaChapters, findMangaVolumes } from './mangadex-api-data'
import { mangadexUploadClient } from './mangadex-clients'

import PDFDocument from 'pdfkit'
import sizeOf from 'image-size'

import type { Chapter } from '../models/interfaces/chapter'
import type { AxiosResponse } from 'axios'

interface DownloadImagesResponse {
  path: string
  page: string
  response: AxiosResponse<Buffer, any>
}

const folderPath = process.env.DOWNLOAD_FOLDER
const showLogs = process.env.SHOW_LOGS === 'true'

function createDestinationFolder(): void {
  if (!folderPath) throw new Error('Destination folder not found')
  if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true })
}

export async function mangaDownload(mangaId: string, mangaName: string): Promise<void> {
  createDestinationFolder()

  const volumes = await findMangaVolumes(mangaId)

  console.log('🟢 \x1b[32mDOWNLOADING VOLUMES\x1b[0m')
  for (const volume of volumes) {
    console.log('\x1b[37m-------------------------\x1b[0m')
    console.log(`🔹 \x1b[36mVol. ${volume.volume}\x1b[0m - \x1b[33m${volume.chapters.length} chapters\x1b[0m`)

    const chaptersImagesPath: string[] = []

    for (const chapter of volume.chapters) {
      showLogs && console.log('Downloading chapter: ', chapter.chapter)
      const chapterData = await findMangaChapters(chapter.id)

      // TODO - add verification of exceptions
      chaptersImagesPath.push(...await downloadChapter(chapterData))
    }

    showLogs && console.log('Total pages: ', chaptersImagesPath.length)
    const notDownloaded = chaptersImagesPath.filter(
      (path) => !existsSync(path)
    )
    showLogs && console.log('Not downloaded: ', notDownloaded.length)

    await createChapterPDF(chaptersImagesPath, mangaName, volume.volume)
    console.log(`✅ \x1b[32mVolume ${volume.volume} downloaded!\x1b[0m`)
  }

  showLogs && console.log('Done! :D')
}

async function downloadChapter(chapterData: Chapter): Promise<string[]> {
  if (!folderPath) throw new Error('Destination folder not found')

  const { id, data, chapterHash } = chapterData
  const chapterImagesPath: string[] = []

  const responses: DownloadImagesResponse[] = await Promise.all(
    data.map(async (page) => {
      showLogs && console.log(`Downloading ${page}`)
      const pageUrl = `data/${chapterHash}/${page}`
      const pagePath = join(folderPath, `${id}-${page}`)
      chapterImagesPath.push(pagePath)
      return {
        path: pagePath,
        page,
        response: await findImage(pageUrl)
      }
    })
  )

  for (const image of responses) { // save images
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
      showLogs && console.log(
        `im erroring bro :( (${ctx.attemptNum} attempts, ${ctx.attemptsRemaining} remaining)`
      )
    }
  })
}

async function createChapterPDF(
  chaptersImagesPath: string[],
  mangaName: string,
  volume: string
): Promise<void> {
  try {
    if (!folderPath) throw new Error('Destination folder not found')

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

      if (!dimensions.width || !dimensions.height) throw new Error('Image dimensions not found')

      mangaPDF
        .addPage({
          size: [dimensions.width, dimensions.height],
          margin: 0
        }).image(imagePath, 0, 0, {
          fit: [dimensions.width, dimensions.height],
          align: 'center',
          valign: 'center'
        })

      unlink(imagePath, (err) => {
        if (err) throw err
      })
    }
    mangaPDF.end()
  } catch (error) {
    showLogs && console.log(error)
  }
}
