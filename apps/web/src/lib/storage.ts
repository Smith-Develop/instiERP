import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set. Configure it in .env");
  if (!key) throw new Error("SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Configure it in .env");
  _supabase = createClient(url, key);
  return _supabase;
}

const BUCKET = "documents";

export async function uploadDocument(
  file: File,
  schoolId: string,
  entityType: string,
): Promise<{ url: string; filename: string }> {
  const supabase = getSupabase();
  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${schoolId}/${entityType}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(filename, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return { url: urlData.publicUrl, filename };
}

export async function deleteDocument(filename: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(BUCKET).remove([filename]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}
