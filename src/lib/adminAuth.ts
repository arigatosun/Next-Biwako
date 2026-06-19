// src/lib/adminAuth.ts
// 管理者専用APIの認可ヘルパ。既存 admin API と同じく
//   Authorization: Bearer <supabase access_token>
//   → supabaseAdmin.auth.getUser(token) → app_metadata.role === 'admin'
// を検証する。
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface AdminUser {
  id: string;
  email: string | null;
}

export type RequireAdminResult =
  | { ok: true; user: AdminUser }
  | { ok: false; response: NextResponse };

/**
 * リクエストが管理者によるものか検証する。
 * 失敗時は適切なステータスの NextResponse を response に詰めて返す。
 */
export async function requireAdmin(request: NextRequest): Promise<RequireAdminResult> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const token = authHeader.split(' ')[1];
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid token or insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  const role = (data.user.app_metadata as { role?: string } | undefined)?.role;
  if (role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid token or insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user: { id: data.user.id, email: data.user.email ?? null } };
}
