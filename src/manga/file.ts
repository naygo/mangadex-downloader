import 'dotenv/config'

import { createWriteStream, existsSync, mkdirSync, readFileSync, unlink, writeFileSync } from "fs"
import { basename, join, resolve } from "path"

import JSZip from "jszip"
import sizeOf from 'image-size'
import PDFDocument from 'pdfkit'

const showLogs = process.env.SHOW_LOGS === "true"

export function createVolumeFolder(volume: string, folderPath: string): string {
  const volumeFolderPath = join(folderPath, `Vol. ${volume}`)
  if (!existsSync(volumeFolderPath)) mkdirSync(volumeFolderPath, { recursive: true })

  return volumeFolderPath
}

export async function createChapterPDF(
  chaptersImagesPath: string[],
  mangaName: string,
  volume: string,
  folderPath: string
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

export async function generateZip(
  mangaName: string,
  volumesPath: string[],
  folderPath: string
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