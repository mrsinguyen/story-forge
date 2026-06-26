import { useLiveQuery } from "dexie-react-hooks";
import { db, type Note } from "./db";

export function useNote(chapterId: string, pageNumber: number): Note | undefined {
  return useLiveQuery(
    () => db.notes.where({ chapterId, pageNumber }).first(),
    [chapterId, pageNumber],
  );
}

export function useAllNotes(): Note[] {
  return useLiveQuery(() => db.notes.orderBy("updatedAt").reverse().toArray(), []) ?? [];
}

type Locator = Pick<Note, "seriesId" | "volumeId" | "chapterId" | "pageNumber">;

export async function upsertNote(locator: Locator, body: string): Promise<void> {
  const trimmed = body.trim();
  await db.transaction("rw", db.notes, async () => {
    const existing = await db.notes
      .where({ chapterId: locator.chapterId, pageNumber: locator.pageNumber })
      .first();

    // Empty body removes the note (or is a no-op if there isn't one).
    if (!trimmed) {
      if (existing?.id != null) await db.notes.delete(existing.id);
      return;
    }

    const now = Date.now();
    if (existing?.id != null) {
      await db.notes.update(existing.id, { body: trimmed, updatedAt: now });
    } else {
      await db.notes.add({ ...locator, body: trimmed, createdAt: now, updatedAt: now });
    }
  });
}

export async function removeNote(id: number): Promise<void> {
  await db.notes.delete(id);
}
