import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Leaf,
  Users,
  Landmark,
  Trophy,
  FileBarChart,
  Settings,
  Factory,
  Package,
  Truck,
  Cloud,
  Target,
  HandHeart,
  BadgeCheck,
  GraduationCap,
  UserSquare2,
  FileText,
  ClipboardCheck,
  ShieldAlert,
  Flag,
  Award,
  Gift,
  Medal,
  ListTodo,
  Building2,
  Tags,
  SlidersHorizontal,
  Bell,
  UserCog,
  Sprout,
} from "lucide-react";
import type { ModuleKey } from "@/lib/constants";
import type { Capability } from "@/lib/permissions";

export interface NavLink {
  title: string;
  href: string;
  icon: LucideIcon;
  /** If set, only shown when the user has this capability. */
  capability?: Capability;
}

export interface NavGroup {
  title: string;
  icon: LucideIcon;
  href: string;
  module?: ModuleKey;
  items?: NavLink[];
}

export const NAV: NavGroup[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "My Work",
    icon: ListTodo,
    href: "/my-work",
  },
  {
    title: "Environmental",
    icon: Leaf,
    href: "/environmental",
    module: "environmental",
    items: [
      { title: "Overview", href: "/environmental", icon: Sprout },
      { title: "Emission Factors", href: "/environmental/emission-factors", icon: Cloud },
      { title: "Product Profiles", href: "/environmental/product-profiles", icon: Package },
      { title: "Operations", href: "/environmental/operations", icon: Factory },
      { title: "Carbon Transactions", href: "/environmental/carbon-transactions", icon: Truck },
      { title: "Goals", href: "/environmental/goals", icon: Target },
    ],
  },
  {
    title: "Social",
    icon: Users,
    href: "/social",
    module: "social",
    items: [
      { title: "Overview", href: "/social", icon: Users },
      { title: "CSR Activities", href: "/social/activities", icon: HandHeart },
      { title: "Participation", href: "/social/participation", icon: BadgeCheck },
      { title: "Diversity", href: "/social/diversity", icon: UserSquare2 },
      { title: "Training", href: "/social/training", icon: GraduationCap },
    ],
  },
  {
    title: "Governance",
    icon: Landmark,
    href: "/governance",
    module: "governance",
    items: [
      { title: "Overview", href: "/governance", icon: Landmark },
      { title: "Policies", href: "/governance/policies", icon: FileText },
      { title: "Acknowledgements", href: "/governance/acknowledgements", icon: ClipboardCheck },
      { title: "Audits", href: "/governance/audits", icon: ClipboardCheck },
      { title: "Compliance", href: "/governance/compliance", icon: ShieldAlert },
    ],
  },
  {
    title: "Gamification",
    icon: Trophy,
    href: "/gamification",
    module: "gamification",
    items: [
      { title: "Overview", href: "/gamification", icon: Trophy },
      { title: "Challenges", href: "/gamification/challenges", icon: Flag },
      { title: "Participation", href: "/gamification/participation", icon: BadgeCheck },
      { title: "Badges", href: "/gamification/badges", icon: Award },
      { title: "Rewards", href: "/gamification/rewards", icon: Gift },
      { title: "Leaderboard", href: "/gamification/leaderboard", icon: Medal },
    ],
  },
  {
    title: "Reports",
    icon: FileBarChart,
    href: "/reports",
    items: [
      { title: "Overview", href: "/reports", icon: FileBarChart },
      { title: "Environmental", href: "/reports/environmental", icon: Leaf },
      { title: "Social", href: "/reports/social", icon: Users },
      { title: "Governance", href: "/reports/governance", icon: Landmark },
      { title: "ESG Summary", href: "/reports/esg-summary", icon: FileBarChart },
      { title: "Custom Builder", href: "/reports/custom", icon: SlidersHorizontal },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    items: [
      { title: "Departments", href: "/settings/departments", icon: Building2 },
      { title: "Categories", href: "/settings/categories", icon: Tags },
      { title: "Users", href: "/settings/users", icon: UserCog },
      { title: "ESG Configuration", href: "/settings/esg-configuration", icon: SlidersHorizontal },
      { title: "Notifications", href: "/settings/notifications", icon: Bell },
    ],
  },
];
