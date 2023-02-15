export interface MangadexAggregate {
  result: string
  volumes: MangadexAggregateVolume
}

export type MangadexAggregateVolume = Record<string, {
  volume: string
  count: number
  chapters: MangadexAggregateChapter
}>

export type MangadexAggregateChapter = Record<string, {
  chapter: string
  id: string
  others: string[]
}>
