import { MangadexAggregateVolume, Volume } from '@/models/interfaces'

export function formatVolumes(volumes: MangadexAggregateVolume): Volume[] {
  const volumesAndChapters = Object.values(volumes).map((volume) => {
    const sortedChapters = Object.values(volume.chapters).sort(
      (a: any, b: any) => {
        return a.chapter - b.chapter
      }
    )

    return {
      volume: volume.volume,
      chapters: sortedChapters.map((chapter) => ({
        id: chapter.id,
        chapter: chapter.chapter
      }))
    }
  })

  return volumesAndChapters
}
