import { HeartIcon } from "@phosphor-icons/react";
import { IconButton } from "@src/components/primitives/icon-button";
import { useReaction, type ReactionTargetType } from "@src/lib/reactions";

type Props = {
  targetType: ReactionTargetType;
  targetId: string;
  // Free-text noun used in the aria-label, e.g. "song", "the Daughter of Evil".
  // Falls back to the target type so the label is always readable.
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * One-tap reaction toggle for a series, song, or character. Persists locally
 * via Dexie — on toggle, the underlying reaction record is created or deleted
 * inside a transaction so concurrent taps stay coherent.
 */
export function ReactionButton({ targetType, targetId, label, size = "sm", className }: Props) {
  const { active, toggle } = useReaction(targetType, targetId);
  const noun = label ?? targetType;
  return (
    <IconButton
      variant="ghost"
      size={size}
      aria-label={active ? `Unlike ${noun}` : `Like ${noun}`}
      aria-pressed={active}
      onClick={() => void toggle()}
      className={className}
    >
      <HeartIcon
        weight={active ? "fill" : "light"}
        className={active ? "text-accent" : undefined}
      />
    </IconButton>
  );
}
