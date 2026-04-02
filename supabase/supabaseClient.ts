import { createClient } from "@supabase/supabase-js"

// Vite exposes `import.meta.env`, but this file is outside the normal Vite / TS project scope.
// Cast to `any` to avoid TS errors while still allowing runtime access.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). " +
      "Ensure they are defined in your environment."
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)