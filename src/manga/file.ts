import 'dotenv/config'

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  unlink,
  writeFileSync
} from 'fs'
import JSZip from 'jszip'
import sizeOf from 'image-size'
import { basename, join, resolve } from 'path'
import PDFDocument from 'pdfkit'

const showLogs = process.env.SHOW_LOGS === 'true'

export function createVolumeFolder(
  mangaName: string,
  volume: string,
  folderPath: string
): string {
  const volumeFolderPath = join(folderPath, `${mangaName} - Vol. ${volume}`)
  if (!existsSync(volumeFolderPath))
    mkdirSync(volumeFolderPath, { recursive: true })

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

export function createDestinationFolder(mangaName: string): string {
  const dirPath = process.env.DOWNLOAD_FOLDER as string
  if (!dirPath) throw new Error('DOWNLOAD_FOLDER is not defined in .env file')

  const newFolderPath = join(dirPath, mangaName)
  if (!existsSync(newFolderPath)) mkdirSync(newFolderPath, { recursive: true })

  return resolve(newFolderPath)
}

import { CroppingEnum } from '@/../node-kcc/src/models'
import { KccNode } from 'node-kcc'

export async function convertToMobi(params: {
  outputDir: string
  inputFile: string
  mangaName: string
}): Promise<void> {
  console.log('🗃️ Creating Mobi...')

  const { inputFile, mangaName, outputDir } = params

  const kccNode = new KccNode({
    outputDir
  })

  await kccNode.convert({
    inputFile,
    convertOptions: {
      title: mangaName,
      cropping: CroppingEnum.MARGINS,
      format: 'MOBI',
      mangaStyle: true,
      stretch: true,
      upscale: true
    }
  })
}
