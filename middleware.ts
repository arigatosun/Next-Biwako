// middleware.ts

import { createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareSupabaseClient({ req, res });

  // セッションを取得
  await supabase.auth.getSession();

  return res;
}

// マッチさせたいパスを指定
export const config = {
  matcher: ['/api/:path*'],
};
