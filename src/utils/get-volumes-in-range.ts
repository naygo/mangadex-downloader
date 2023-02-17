import { Volume, VolumeRange } from '@/models/interfaces'

export function getVolumesInRange(
  volumes: Volume[],
  volumeRange: VolumeRange
): Volume[] {
  const { start, end } = volumeRange

  const volumesInRange = volumes.filter((volume) => {
    const volumeNum = Number(volume.volume)
    if (isNaN(volumeNum)) {
      return false
    }
    if (end === -1) {
      return volumeNum >= start
    } else {
      return volumeNum >= start && volumeNum <= end
    }
  })

  return volumesInRange
}
