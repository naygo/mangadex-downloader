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
