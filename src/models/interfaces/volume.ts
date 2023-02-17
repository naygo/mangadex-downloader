export interface Volume {
  volume: string
  chapters: Array<{
    chapter: string
    id: string
  }>
}

export interface VolumeRange {
  start: number
  end: number
}
