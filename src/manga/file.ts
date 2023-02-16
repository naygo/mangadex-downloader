import { existsSync, mkdirSync } from "fs"
import { join } from "path"

export function createVolumeFolder(volume: string, folderPath: string): string {
  const volumeFolderPath = join(folderPath, `Vol. ${volume}`)
  if (!existsSync(volumeFolderPath)) mkdirSync(volumeFolderPath, { recursive: true })

  return volumeFolderPath
}