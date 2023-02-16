import 'dotenv/config'

import { CroppingEnum } from '@/../node-kcc/src/models'
import { KccNode } from 'node-kcc'

if (!process.env.DOWNLOAD_FOLDER) {
  throw new Error('DOWNLOAD_FOLDER is not defined in .env file')
}

const kccNode = new KccNode({
  outputDir: process.env.DOWNLOAD_FOLDER
})

export async function convertToMobi(
  inputFile: string,
  mangaName: string
): Promise<void> {
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
