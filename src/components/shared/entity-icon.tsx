import {
  Award,
  Bike,
  BookOpenCheck,
  Bus,
  Car,
  Crown,
  Droplets,
  Flame,
  Footprints,
  Gem,
  Globe,
  HandHeart,
  Heart,
  Leaf,
  Lightbulb,
  Medal,
  Recycle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Target,
  ThumbsUp,
  TreePine,
  TrendingUp,
  Trophy,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Curated icon set shared by badges, challenges and categories.
 * Values are Lucide component names stored as plain strings in the DB;
 * unknown names fall back to the given fallback (or Award).
 */
export const ENTITY_ICON_MAP: Record<string, LucideIcon> = {
  Award,
  Trophy,
  Medal,
  Star,
  Crown,
  Flame,
  Zap,
  Target,
  Leaf,
  Heart,
  ShieldCheck,
  Rocket,
  Gem,
  ThumbsUp,
  Sparkles,
  TrendingUp,
  HandHeart,
  BookOpenCheck,
  // Green / sustainability icons
  Recycle,
  TreePine,
  Sprout,
  Droplets,
  Sun,
  Wind,
  Bike,
  Bus,
  Car,
  Globe,
  Lightbulb,
  Footprints,
};

export const ENTITY_ICON_OPTIONS = Object.keys(ENTITY_ICON_MAP).map((k) => ({
  label: k,
  value: k,
}));

export function EntityIcon({
  name,
  fallback,
  className,
}: {
  name?: string | null;
  fallback?: LucideIcon;
  className?: string;
}) {
  const Icon = (name && ENTITY_ICON_MAP[name]) || fallback || Award;
  return <Icon className={cn("size-5", className)} />;
}
