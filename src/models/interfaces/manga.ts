export interface MangaDexResponse<T> {
  id: string
  type: string
  attributes: T
  relationships: Relationship[]
}

export interface Manga {
  id: string
  type: string
  attributes: MangaAttributes
  relationships: Relationship[]
}

export interface Cover {
  createdAt: string
  description: string
  fileName: string
  locale: string
  updatedAt: string
  version: number
  volume: string
}

export interface MangaAttributes {
  title: Title
  altTitles: AltTitle[]
  description: PurpleDescription
  isLocked: boolean
  links: Links
  originalLanguage: string
  lastVolume: string
  lastChapter: string
  publicationDemographic: string
  status: string
  year: number
  contentRating: string
  tags: Tag[]
  state: string
  chapterNumbersResetOnNewVolume: boolean
  createdAt: Date
  updatedAt: Date
  version: number
  availableTranslatedLanguages: Array<null | string>
  latestUploadedChapter: string
}

export interface AltTitle {
  ko?: string
  ru?: string
  ja?: string
  uk?: string
}

export interface PurpleDescription {
  en: string
  ru: string
}

export interface Links {
  al: string
  ap: string
  bw: string
  kt: string
  mu: string
  amz: string
  ebj: string
  mal: string
  engtl: string
}

export interface Tag {
  id: string
  type: string
  attributes: TagAttributes
  relationships: any[]
}

export interface TagAttributes {
  name: Title
  // description: FluffyDescription
  group: string
  version: number
}

// export interface FluffyDescription {}

export interface Title {
  en: string
  ja: string
}

export interface Relationship {
  id: string
  type: string
  related?: string
  attributes?: {
    name: string
  }
}
