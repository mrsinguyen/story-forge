import Dexie, { type Table } from "dexie";

export type ChapterProgress = {
  chapterId: string;
  pagesRead: number;
  totalPages: number;
  lastReadAt: number;
};

export type Bookmark = {
  id?: number;
  seriesId: string;
  volumeId: string;
  chapterId: string;
  pageNumber: number;
  label?: string;
  createdAt: number;
};

export type Note = {
  id?: number;
  seriesId: string;
  volumeId: string;
  chapterId: string;
  pageNumber: number;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export type ReactionTargetType = "series" | "song" | "character";
export type ReactionKind = "like";

export type Reaction = {
  id?: number;
  targetType: ReactionTargetType;
  targetId: string;
  kind: ReactionKind;
  createdAt: number;
};

class StoryForgeDatabase extends Dexie {
  chapterProgress!: Table<ChapterProgress, string>;
  bookmarks!: Table<Bookmark, number>;
  notes!: Table<Note, number>;
  reactions!: Table<Reaction, number>;

  constructor() {
    super("story-forge");
    this.version(1).stores({
      chapterProgress: "&chapterId, lastReadAt",
    });
    this.version(2).stores({
      chapterProgress: "&chapterId, lastReadAt",
      bookmarks: "++id, chapterId, volumeId, seriesId, [chapterId+pageNumber], createdAt",
    });
    this.version(3).stores({
      chapterProgress: "&chapterId, lastReadAt",
      bookmarks: "++id, chapterId, volumeId, seriesId, [chapterId+pageNumber], createdAt",
      notes: "++id, chapterId, volumeId, seriesId, [chapterId+pageNumber], updatedAt",
    });
    this.version(4).stores({
      chapterProgress: "&chapterId, lastReadAt",
      bookmarks: "++id, chapterId, volumeId, seriesId, [chapterId+pageNumber], createdAt",
      notes: "++id, chapterId, volumeId, seriesId, [chapterId+pageNumber], updatedAt",
      // [targetType+targetId+kind] is the natural unique key — Dexie's compound
      // index lets us check / toggle a single reaction in one indexed read.
      reactions: "++id, [targetType+targetId+kind], targetType, createdAt",
    });
  }
}

export const db = new StoryForgeDatabase();
