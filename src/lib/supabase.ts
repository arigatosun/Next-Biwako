import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/app/types/supabase'

let supabase: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabase() {
  if (!supabase) {
    supabase = createClientComponentClient<Database>()
  }
  return supabase
}