import { CroppingEnum } from '@/../node-kcc/src/models'
import { join } from 'path'
import { KccNode } from 'node-kcc'

const kccNode = new KccNode({
  outputDir: join(__dirname, '../../tmp/output')
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
