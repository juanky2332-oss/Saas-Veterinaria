import { createServiceClient } from "@/lib/supabase/server";
import { BlogFormClient } from "../blog-form-client";

export const dynamic = "force-dynamic";

export default async function NuevoPostPage() {
  const supabase = createServiceClient();
  const { data: cats } = await supabase.from("blog_categories").select("id, nombre").order("orden");
  return <BlogFormClient post={null} categorias={cats ?? []} />;
}
