// src/lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
// 注意: service_role キーは絶対にログ出力しない（フルアクセス権を持つ機密情報）。

export { supabaseAdmin };
