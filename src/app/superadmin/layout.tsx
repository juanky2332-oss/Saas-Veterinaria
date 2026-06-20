import { requireSuperadmin } from "@/lib/auth/superadmin";
import { getCurrentProfile } from "@/lib/auth/org";
import { SuperadminShell } from "./_components/superadmin-shell";

export const metadata = { title: "Plataforma — Veteriblandenguer" };

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperadmin();
  const profile = await getCurrentProfile();
  return <SuperadminShell nombre={profile?.nombre ?? "Superadmin"}>{children}</SuperadminShell>;
}
