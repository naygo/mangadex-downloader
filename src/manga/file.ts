import 'dotenv/config'

import fs from 'fs'
import JSZip from 'jszip'
import sizeOf from 'image-size'
import path from 'path'
import PDFDocument from 'pdfkit'
import { KccNode } from 'node-kcc'
import { CroppingEnum } from 'node-kcc/dist/models'

const showLogs = process.env.SHOW_LOGS === 'true'

export function createVolumeFolder(
  mangaName: string,
  volume: string,
  folderPath: string
): string {
  const volumeFolderPath = path.join(
    folderPath,
    `${mangaName} - Vol. ${volume}`
  )

  if (!fs.existsSync(volumeFolderPath)) {
    fs.mkdirSync(volumeFolderPath, { recursive: true })
  }

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
  const filePath = path.resolve(folderPath, fileName)

  mangaPDF.pipe(fs.createWriteStream(filePath))

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

    fs.unlink(imagePath, (err) => {
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
    const volumeName = path.basename(volumePath)
    const files = await fs.promises.readdir(volumePath)

    for (const file of files) {
      const filePath = path.join(volumePath, file)
      const fileContent = await fs.promises.readFile(filePath)

      zipFolder?.file(`${volumeName}/${file}`, fileContent)
    }
  }

  const zipData = await zip.generateAsync({ type: 'nodebuffer' })
  const zipPath = path.join(folderPath, `${mangaName}.zip`)

  await fs.promises.writeFile(zipPath, zipData)

  for (const volumePath of volumesPath) {
    fs.promises.rmdir(volumePath, { recursive: true })
  }

  console.log(`✅ \x1b[32mZIP created: ${zipPath}\x1b[0m`)
}

export function createDestinationFolder(mangaName: string): string {
  const dirPath = process.env.DOWNLOAD_FOLDER as string

  if (!dirPath) throw new Error('DOWNLOAD_FOLDER is not defined in .env file')

  const newFolderPath = path.join(dirPath, mangaName)

  if (!fs.existsSync(newFolderPath)) {
    fs.mkdirSync(newFolderPath, { recursive: true })
  }

  return path.resolve(newFolderPath)
}
