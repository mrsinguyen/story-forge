import { useLiveQuery } from "dexie-react-hooks";
import { db, type Bookmark } from "./db";

export function useBookmark(chapterId: string, pageNumber: number): Bookmark | undefined {
  return useLiveQuery(
    () => db.bookmarks.where({ chapterId, pageNumber }).first(),
    [chapterId, pageNumber],
  );
}

export function useAllBookmarks(): Bookmark[] {
  return useLiveQuery(() => db.bookmarks.orderBy("createdAt").reverse().toArray(), []) ?? [];
}

type ToggleArgs = Pick<Bookmark, "seriesId" | "volumeId" | "chapterId" | "pageNumber">;

export async function toggleBookmark(args: ToggleArgs): Promise<void> {
  await db.transaction("rw", db.bookmarks, async () => {
    const existing = await db.bookmarks
      .where({ chapterId: args.chapterId, pageNumber: args.pageNumber })
      .first();
    if (existing?.id != null) {
      await db.bookmarks.delete(existing.id);
      return;
    }
    await db.bookmarks.add({ ...args, createdAt: Date.now() });
  });
}

export async function removeBookmark(id: number): Promise<void> {
  await db.bookmarks.delete(id);
}

export async function setBookmarkLabel(id: number, label: string): Promise<void> {
  // Empty / whitespace-only clears the label entirely. Dexie deletes the key
  // when the patch value is undefined.
  const trimmed = label.trim();
  await db.bookmarks.update(id, { label: trimmed || undefined });
}
