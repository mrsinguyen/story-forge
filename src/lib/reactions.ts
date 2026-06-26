import { useCallback, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Reaction, type ReactionKind, type ReactionTargetType } from "./db";

export type { Reaction, ReactionKind, ReactionTargetType };

/**
 * Read-and-toggle hook for a single reaction.
 *
 * Reads come from `useLiveQuery` over the `[targetType+targetId+kind]`
 * compound index — one indexed read, re-fires on any reactions table
 * change. Writes go through an `rw` transaction that re-reads the row
 * inside the transaction so concurrent toggles produce the right final
 * state regardless of order.
 *
 * The returned `active` is layered with an optimistic flag so a fast
 * double-click doesn't flicker waiting on the next live-query tick: each
 * toggle flips the optimistic value immediately, the DB write proceeds,
 * and the optimistic flag clears as soon as the persisted state catches
 * up to it. If the write throws, the optimistic flag is cleared so the UI
 * snaps back to whatever the DB actually says.
 */
export function useReaction(
  targetType: ReactionTargetType,
  targetId: string,
  kind: ReactionKind = "like",
): {
  active: boolean;
  reaction: Reaction | undefined;
  toggle: () => Promise<void>;
} {
  const reaction = useLiveQuery(
    () =>
      db.reactions.where("[targetType+targetId+kind]").equals([targetType, targetId, kind]).first(),
    [targetType, targetId, kind],
  );
  const persisted = !!reaction;

  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  // Once the live query catches up to whatever the user just clicked,
  // hand control back to the DB-derived value.
  useEffect(() => {
    if (optimistic !== null && persisted === optimistic) {
      setOptimistic(null);
    }
  }, [optimistic, persisted]);

  const active = optimistic ?? persisted;

  const toggle = useCallback(async () => {
    const next = !active;
    setOptimistic(next);
    try {
      await db.transaction("rw", db.reactions, async () => {
        const existing = await db.reactions
          .where("[targetType+targetId+kind]")
          .equals([targetType, targetId, kind])
          .first();
        // Idempotent w.r.t. `next` so concurrent transactions still arrive
        // at the user's most recent intent without thrashing.
        if (next && !existing) {
          await db.reactions.add({ targetType, targetId, kind, createdAt: Date.now() });
        } else if (!next && existing?.id != null) {
          await db.reactions.delete(existing.id);
        }
      });
    } catch (err) {
      // Roll back the optimistic flag so the UI doesn't lie about persisted state.
      setOptimistic(null);
      throw err;
    }
  }, [active, targetType, targetId, kind]);

  return { active, reaction, toggle };
}

/**
 * All reactions on a given target type, newest first. Useful for surfacing
 * "Liked series", "Liked songs", etc. on a profile-style page later.
 */
export function useReactions(
  targetType: ReactionTargetType,
  kind: ReactionKind = "like",
): Reaction[] {
  return (
    useLiveQuery(
      () =>
        db.reactions
          .where("targetType")
          .equals(targetType)
          .filter((r) => r.kind === kind)
          .reverse()
          .sortBy("createdAt"),
      [targetType, kind],
    ) ?? []
  );
}
