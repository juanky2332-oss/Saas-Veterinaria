import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/org";
import { resolveFeatures } from "@/lib/features";
import {
  resolveTenantTheme,
  themeToStyle,
  type VerticalPreset,
} from "@/lib/theme/themes";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { Toaster } from "sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (!profile?.organization_id) redirect("/onboarding");

  const { data: org } = await supabase
    .from("organizations")
    .select("nombre, vertical, brand_color, accent_color, logo_path, features")
    .eq("id", profile.organization_id)
    .maybeSingle();

  const theme = resolveTenantTheme({
    vertical: (org?.vertical as VerticalPreset) ?? "general",
    brandColor: org?.brand_color,
    accentColor: org?.accent_color,
  });
  const clinicName = org?.nombre ?? "Veteriblandenguer";
  const logoUrl = org?.logo_path ?? null;
  const features = resolveFeatures(org?.vertical, org?.features);

  return (
    <SidebarProvider>
      <div style={themeToStyle(theme)} className="app-bg flex h-dvh overflow-hidden">
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar clinicName={clinicName} logoUrl={logoUrl} features={features} isSuperadmin={profile.is_superadmin} />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <div className="md:hidden">
            <MobileHeader clinicName={clinicName} logoUrl={logoUrl} features={features} />
          </div>
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
        </div>

        <MobileNav features={features} />
      </div>

      <AssistantWidget />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontFamily: "var(--font-body)",
            borderRadius: "12px",
            boxShadow: "var(--shadow-pop)",
          },
        }}
      />
    </SidebarProvider>
  );
}
