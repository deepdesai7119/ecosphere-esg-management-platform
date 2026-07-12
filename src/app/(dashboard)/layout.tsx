import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { ChatbotWidget } from "@/components/shared/ChatbotWidget";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <AppShell user={{ name: user.name, email: user.email, role: user.role }}>
      {children}
      <ChatbotWidget />
    </AppShell>
  );
}
