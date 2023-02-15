export interface Chapter {
  id: string;
  host: string;
  chapterHash: string;
  data: string[];
  dataSaver: string;
}

export interface MangadexChapter {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string;
  };
}
