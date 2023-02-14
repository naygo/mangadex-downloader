import 'dotenv/config'

import { createWriteStream, unlinkSync } from 'fs'
import { resolve } from 'path'
import PDFDocument from 'pdfkit'
import sizeOf from 'image-size'

export async function createChapterPDF(
  caminhoDasImagens: string[],
  nomeManga: string,
  volume: string
): Promise<any> {
  console.log('Criando arquivo PDF...')

  const manga = new PDFDocument({
    autoFirstPage: false,
    size: [960, 1481],
    compress: true
  })

  if (process.env.DOWNLOAD_FOLDER == null) {
    throw new Error('Local de download não encontrado')
  }

  const nomeArquivo = `${nomeManga} - Vol. ${volume}.pdf`
  const caminhoArquivo = resolve(process.env.DOWNLOAD_FOLDER, nomeArquivo)
  manga.pipe(createWriteStream(caminhoArquivo))

  for (const imagem of caminhoDasImagens) {
    const dimensoes = sizeOf(imagem)

    if (dimensoes.width === undefined || dimensoes.height === undefined) {
      throw new Error('Dimensões da imagem não encontradas')
    }

    manga
      .addPage({
        margin: 0,
        size: [dimensoes.width, dimensoes.height]
      })
      .image(imagem, 0, 0, {
        height: manga.page.height
      })

    unlinkSync(imagem)
  }

  manga.end()

  console.log('Arquivo PDF criado com sucesso! :D')

  return {
    nomeArquivo,
    caminhoArquivo
  }
}
