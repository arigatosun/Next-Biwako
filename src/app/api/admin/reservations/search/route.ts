// src/app/api/admin/reservations/search/route.ts
// 管理者がキャンセル対象（ねっぱん由来）予約を特定するための横断検索。
// 既存の admin API はアフィリエイト紐付き予約しか返さないため新設。
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// 枠を消費している（=空きを塞いでいる）予約ステータス。
// reservation-calendar / checkStayAvailability と同一の集合。
const OCCUPYING_STATUSES = ['pending', 'confirmed', 'paid', 'processing'];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name')?.trim();
  const phone = searchParams.get('phone')?.trim();
  const checkInDate = searchParams.get('checkInDate')?.trim();
  const from = searchParams.get('from')?.trim();
  const to = searchParams.get('to')?.trim();
  const includeAll = searchParams.get('includeAll') === 'true';

  if (!name && !phone && !checkInDate && !(from && to)) {
    return NextResponse.json(
      { error: '氏名・電話番号・宿泊日・期間のいずれかを指定してください' },
      { status: 400 }
    );
  }

  try {
    let query = supabaseAdmin
      .from('reservations')
      .select(
        `id, reservation_number, name, name_kana, email, phone_number,
         check_in_date, num_nights, num_units, guest_counts,
         reservation_status, payment_method, total_amount, payment_amount,
         coupon_code, neppan_reservation_id, sync_status, created_at`
      )
      .order('check_in_date', { ascending: false })
      .limit(200);

    if (!includeAll) {
      query = query.in('reservation_status', OCCUPYING_STATUSES);
    }
    // 宿泊日は強い絞り込み（1日最大2枠）なのでDB側で。氏名・電話は表記ゆれ対策のため後段でJS正規化突合する。
    // from/to 指定時は期間内に「開始する」予約を取得（連泊の重なり判定は呼び出し側でJS算出する）。
    if (checkInDate) query = query.eq('check_in_date', checkInDate);
    else if (from && to) query = query.gte('check_in_date', from).lte('check_in_date', to);

    const { data, error } = await query;
    if (error) {
      console.error('Reservation search error:', error);
      return NextResponse.json({ error: '検索に失敗しました' }, { status: 500 });
    }

    // 正規化：氏名は「様・空白（全角含む）」を除去、電話は数字のみ。
    const normName = (s: string | null) => (s ?? '').toLowerCase().replace(/[\s　様]/g, '');
    const digits = (s: string | null) => (s ?? '').replace(/[^0-9]/g, '');

    let rows = data ?? [];
    // 宿泊日が指定された場合は、その日の予約（最大2件）をすべて返す（氏名・電話の表記ゆれで取りこぼさない）。
    // 宿泊日が無い場合のみ、氏名・電話で正規化して絞り込む。
    if (!checkInDate) {
      if (name) {
        const n = normName(name);
        rows = rows.filter((r) => normName(r.name).includes(n));
      }
      if (phone) {
        const p = digits(phone);
        if (p) rows = rows.filter((r) => digits(r.phone_number).includes(p));
      }
    }

    return NextResponse.json({ reservations: rows.slice(0, 50) });
  } catch (e) {
    console.error('Reservation search exception:', e);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
