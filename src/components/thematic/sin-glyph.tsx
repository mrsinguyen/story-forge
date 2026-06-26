import {
  AppleLogoIcon,
  CoinsIcon,
  CrosshairIcon,
  CrownIcon,
  ForkKnifeIcon,
  GiftIcon,
  MaskHappyIcon,
  ScissorsIcon,
} from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import type { Sin } from "@src/lib/schema";

const map = {
  pride: CrownIcon,
  lust: MaskHappyIcon,
  // Margarita Blankenheim's poison was named "Gift" (German for poison) —
  // a deceptive present she bestowed on her hometown. Direct double meaning.
  sloth: GiftIcon,
  gluttony: ForkKnifeIcon,
  greed: CoinsIcon,
  // Phosphor doesn't ship a gun/pistol — Crosshair stands in for the muzzle
  // / gunsight semantics of "Muzzle of Nemesis" while staying recognisable.
  wrath: CrosshairIcon,
  // Enbizaka's tailor wields cursed scissors — direct vessel reference.
  envy: ScissorsIcon,
  origin: AppleLogoIcon, // Eve and the apple — original sin
} as const;

type Props = { sin: Sin } & Omit<ComponentProps<typeof CrownIcon>, "ref">;

export function SinGlyph({ sin, ...props }: Props) {
  const Icon = map[sin];
  return <Icon {...props} />;
}
