import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { can, type Capability } from "@/lib/permissions";

const SETTINGS_PAGES: { href: string; capability: Capability }[] = [
  { href: "/settings/departments", capability: "department.manage" },
  { href: "/settings/categories", capability: "category.manage" },
  { href: "/settings/users", capability: "user.manage" },
  { href: "/settings/esg-configuration", capability: "esgConfig.manage" },
  { href: "/settings/notifications", capability: "notification.broadcast" },
];

export default async function SettingsPage() {
  const user = await requireUser();
  const first = SETTINGS_PAGES.find((p) => can(user.role, p.capability));
  redirect(first?.href ?? "/dashboard?denied=1");
}
