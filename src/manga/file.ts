import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

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
