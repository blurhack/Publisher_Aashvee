import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/src/integrations/supabase/types"

let serviceClient: ReturnType<typeof createClient<Database>> | null = null

export function getServiceClient() {
  if (serviceClient) return serviceClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing SUPABASE URL or SUPABASE_SERVICE_ROLE_KEY")
  }
  serviceClient = createClient<Database>(url, key)
  return serviceClient
}
