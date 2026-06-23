import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/org";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Crea tu clínica — VetClinic" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (profile?.organization_id) redirect("/dashboard");

  return <OnboardingForm email={user.email ?? ""} />;
}
