// src/app/api/admin/rebooking/route.ts
//
// ねっぱん予約の本サイト「作り直し」を1トランザクションで実行する管理者専用API。
//   1. 旧（ねっぱん由来）予約を customer_cancelled に更新（メール・FastAPI送信なし／キャンセル料なし）
//   2. 同一トランザクション内で新予約日程の空き枠を検証（旧予約は上記で既に枠から外れる）
//   3. 新予約を INSERT（payment_method=onsite / sync_status=complete ＝ 同期cron対象外）
//   4. クーポンを消込（is_reusable のものは消込まない）
//   5. 監査ログ admin_rebooking_logs に記録
//   COMMIT 後に客向け＋管理者向けメールを送信する。
//
// race condition 対策: cancel と create を同一トランザクションに入れることで、
// 解放された枠が他トランザクションへ露出せず、再予約までの隙の横取りを構造的に防ぐ。
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { requireAdmin } from '@/lib/adminAuth';
import { getPool } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  computeReservationAmounts,
  buildMealPlans,
  type MealSelectionInput,
  type MealSelectionFull,
  type MealPlansMap,
} from '@/lib/pricing';
import { normalizeCheckInTime } from '@/lib/rebookingParser';
import { sendReservationEmails } from '@/utils/email';
import { mapReservationRowToPayload, postReservationToFastApi } from '@/lib/reservationSync';

export const dynamic = 'force-dynamic';

const TOTAL_UNITS_PER_DAY = 2;
const PLAN_NAME = '【一棟貸切】贅沢選びつくしヴィラプラン';

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface RebookingReservationInput {
  name: string;
  name_kana?: string;
  email: string;
  gender?: string;
  birth_date?: string;
  phone_number?: string;
  postal_code?: string;
  prefecture?: string;
  city_address?: string;
  building_name?: string | null;
  past_stay?: boolean;
  check_in_date: string;
  num_nights: number;
  num_units: number;
  guest_counts: GuestCountsMap;
  total_guests?: number;
  guests_with_meals?: number;
  estimated_check_in_time?: string;
  purpose?: string;
  special_requests?: string | null;
  transportation_method?: string;
  meal_plans?: MealPlansMap;
  mealSelections?: MealSelectionFull[];
  roomTotalOverride?: number | null;
}

interface RebookingBody {
  targetReservationId: number;
  reservation: RebookingReservationInput;
  couponCode?: string | null;
  /** true の場合、確定後に新予約を FastAPI 経由でねっぱんへ送信（/create_reservation）。 */
  sendToNeppan?: boolean;
}

type GuestCountDay = {
  num_male?: number;
  num_female?: number;
  num_child_with_bed?: number;
  num_child_no_bed?: number;
};
type GuestCountsMap = Record<string, Record<string, GuestCountDay>>;

/** guest_counts（{unit:{date:{num_*}}}）から総宿泊人数を合計する。 */
function sumGuestCounts(guestCounts: GuestCountsMap): number {
  let total = 0;
  for (const unit of Object.values(guestCounts || {})) {
    for (const day of Object.values(unit)) {
      total +=
        (day.num_male || 0) +
        (day.num_female || 0) +
        (day.num_child_with_bed || 0) +
        (day.num_child_no_bed || 0);
    }
  }
  return total;
}

function validate(body: unknown): RebookingBody {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'リクエストが不正です');
  const b = body as {
    targetReservationId?: unknown;
    reservation?: unknown;
    couponCode?: unknown;
    sendToNeppan?: unknown;
  };
  if (!Number.isInteger(b.targetReservationId)) {
    throw new HttpError(400, 'targetReservationId が不正です');
  }
  if (!b.reservation || typeof b.reservation !== 'object') {
    throw new HttpError(400, 'reservation がありません');
  }
  const reservation = b.reservation as RebookingReservationInput;
  if (!reservation.name) throw new HttpError(400, '氏名は必須です');
  if (!reservation.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reservation.email)) {
    throw new HttpError(400, 'メールアドレスが不正です');
  }
  if (!reservation.check_in_date || !/^\d{4}-\d{2}-\d{2}$/.test(reservation.check_in_date)) {
    throw new HttpError(400, 'check_in_date は YYYY-MM-DD 形式で必須です');
  }
  const nights = Number(reservation.num_nights);
  const units = Number(reservation.num_units);
  if (!Number.isInteger(nights) || nights < 1) throw new HttpError(400, '泊数が不正です');
  if (!Number.isInteger(units) || units < 1 || units > TOTAL_UNITS_PER_DAY) {
    throw new HttpError(400, '棟数が不正です');
  }
  return {
    targetReservationId: b.targetReservationId as number,
    reservation,
    couponCode: (b.couponCode as string | null | undefined) ?? null,
    sendToNeppan: b.sendToNeppan === true,
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let body: RebookingBody;
  try {
    body = validate(await request.json());
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'リクエストの解析に失敗しました' }, { status: 400 });
  }

  const r = body.reservation;
  const nights = Number(r.num_nights);
  const units = Number(r.num_units);

  try {
    // --- クーポン検証（消込はトランザクション内） ---
    let coupon:
      | { id: number; affiliate_code: string | null; discount_rate: number | null; discount_amount: number | null; is_reusable: boolean }
      | null = null;
    if (body.couponCode) {
      const { data: couponData, error: couponErr } = await supabaseAdmin
        .from('coupons')
        .select('id, discount_rate, discount_amount, affiliate_code, is_used, is_reusable')
        .eq('coupon_code', body.couponCode)
        .single();
      if (couponErr || !couponData) {
        return NextResponse.json({ error: 'クーポンが見つかりません' }, { status: 400 });
      }
      if (couponData.is_used && !couponData.is_reusable) {
        return NextResponse.json({ error: 'このクーポンは使用済みです' }, { status: 400 });
      }
      coupon = {
        id: couponData.id,
        affiliate_code: couponData.affiliate_code ?? null,
        discount_rate: couponData.discount_rate ?? null,
        discount_amount: couponData.discount_amount ?? null,
        is_reusable: Boolean(couponData.is_reusable),
      };
    }

    // --- 金額をサーバ側で確定（クライアント値は信用しない） ---
    const mealSelections: MealSelectionInput[] = (r.mealSelections ?? []).map((m) => ({
      planId: m.planId,
      count: Number(m.count) || 0,
    }));
    const amounts = computeReservationAmounts({
      checkInDate: r.check_in_date,
      nights,
      units,
      mealSelections,
      coupon: coupon ? { discount_rate: coupon.discount_rate, discount_amount: coupon.discount_amount } : null,
      roomTotalOverride: r.roomTotalOverride ?? null,
    });
    if (amounts.missingDates.length > 0 && (r.roomTotalOverride === null || r.roomTotalOverride === undefined)) {
      return NextResponse.json(
        { error: `料金表に無い日付があります（${amounts.missingDates.join(', ')}）。宿泊料金を手動で指定してください。`, missingDates: amounts.missingDates },
        { status: 400 }
      );
    }

    // affiliate_id をクーポンの affiliate_code から解決
    let affiliateId: number | null = null;
    if (coupon?.affiliate_code) {
      const { data: aff } = await supabaseAdmin
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', coupon.affiliate_code)
        .single();
      affiliateId = aff?.id ?? null;
    }

    // meal_plans 表示用構造（クライアント指定があれば優先、無ければ選択から組み立て）
    const mealPlans = r.meal_plans ?? buildMealPlans(r.mealSelections ?? []);
    const guestCounts: GuestCountsMap = r.guest_counts ?? {};
    const totalGuests = r.total_guests ?? sumGuestCounts(guestCounts);
    const guestsWithMeals = r.guests_with_meals ?? mealSelections.reduce((s, m) => s + m.count, 0);

    const pool = getPool();
    const client = await pool.connect();
    let result: { newReservationId: number; newReservationNumber: string };
    try {
      result = await runRebookingTransaction(client, {
        body,
        r,
        nights,
        units,
        amounts,
        coupon,
        affiliateId,
        mealPlans,
        guestCounts,
        totalGuests,
        guestsWithMeals,
        operator: auth.user.email,
      });
    } finally {
      client.release();
    }

    // --- コミット後にメール送信（失敗しても予約は確定済み） ---
    let emailSent = true;
    let emailError: string | null = null;
    try {
      await sendReservationEmails(
        {
          guestEmail: r.email,
          guestName: r.name,
          adminEmail: process.env.ADMIN_EMAIL || 'info.nest.biwako@gmail.com',
          planName: PLAN_NAME,
          checkInDate: r.check_in_date,
          nights,
          units,
          guestCounts: JSON.stringify(guestCounts ?? {}),
          guestInfo: { email: r.email, phone: r.phone_number || '' },
          paymentMethod: '現地決済',
          totalAmount: amounts.paymentAmount.toLocaleString(),
          specialRequests: r.special_requests ?? undefined,
          reservationNumber: result.newReservationNumber,
          mealPlans: JSON.stringify(mealPlans ?? {}),
          purpose: r.purpose || 'travel',
          pastStay: r.past_stay || false,
        },
        true
      );
    } catch (e) {
      emailSent = false;
      emailError = e instanceof Error ? e.message : String(e);
      console.error('Rebooking email send failed:', e);
    }

    // --- 任意: 新予約をねっぱんへ送信（フロント予約と同じ /create_reservation・新規作成のみ） ---
    // ※元のねっぱん予約のキャンセルは送らない（ユーザー方針(a)）。重複防止は運用側の責務。
    let neppanSent: boolean | null = null;
    let neppanError: string | null = null;
    if (body.sendToNeppan) {
      neppanSent = false;
      try {
        const { data: newRow, error: fetchErr } = await supabaseAdmin
          .from('reservations')
          .select('*')
          .eq('id', result.newReservationId)
          .single();
        if (fetchErr || !newRow) {
          throw new Error(fetchErr?.message || '新予約の再取得に失敗しました');
        }
        const fastApiResult = await postReservationToFastApi(mapReservationRowToPayload(newRow));
        neppanSent = fastApiResult.success;
        if (!fastApiResult.success) neppanError = fastApiResult.error ?? 'unknown error';
      } catch (e) {
        neppanError = e instanceof Error ? e.message : String(e);
        console.error('Rebooking NEPPAN send failed:', e);
      }
    }

    return NextResponse.json({
      success: true,
      newReservationId: result.newReservationId,
      newReservationNumber: result.newReservationNumber,
      cancelledReservationId: body.targetReservationId,
      amounts: {
        roomTotal: amounts.roomTotal,
        mealTotal: amounts.mealTotal,
        totalAmount: amounts.totalAmount,
        discount: amounts.discount,
        paymentAmount: amounts.paymentAmount,
      },
      emailSent,
      emailError,
      neppanSent,
      neppanError,
    });
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Rebooking failed:', e);
    return NextResponse.json({ error: '作り直し処理に失敗しました' }, { status: 500 });
  }
}

interface TxArgs {
  body: RebookingBody;
  r: RebookingReservationInput;
  nights: number;
  units: number;
  amounts: ReturnType<typeof computeReservationAmounts>;
  coupon: { id: number; is_reusable: boolean } | null;
  affiliateId: number | null;
  mealPlans: MealPlansMap;
  guestCounts: GuestCountsMap;
  totalGuests: number;
  guestsWithMeals: number;
  operator: string | null;
}

async function runRebookingTransaction(
  client: PoolClient,
  a: TxArgs
): Promise<{ newReservationId: number; newReservationNumber: string }> {
  const { r, nights, units, amounts } = a;
  await client.query('BEGIN');
  try {
    // 1. 旧予約をロックして取得
    const oldRes = await client.query(
      'SELECT id, reservation_number, reservation_status FROM reservations WHERE id = $1 FOR UPDATE',
      [a.body.targetReservationId]
    );
    if (oldRes.rowCount === 0) throw new HttpError(404, '対象の予約が見つかりません');
    const old = oldRes.rows[0];

    // 2. 旧予約を customer_cancelled へ（キャンセル料なし／メール・FastAPIなし）
    await client.query(
      `UPDATE reservations SET reservation_status = 'customer_cancelled' WHERE id = $1`,
      [old.id]
    );

    // 3. 空き枠チェックは行わない（満室でも作成を止めない方針）。
    //    満室の警告は確定前に管理画面側で表示する（サーバはブロックしない）。

    // 4. 新予約を INSERT
    const reservationNumber = `RES-${Date.now()}`;
    const insert = await client.query(
      `INSERT INTO reservations (
        reservation_number, name, name_kana, email, gender, birth_date, phone_number,
        postal_code, prefecture, city_address, building_name, past_stay, check_in_date,
        num_nights, num_units, guest_counts, estimated_check_in_time, purpose, special_requests,
        transportation_method, room_rate, room_rates, meal_plans, total_guests, guests_with_meals,
        total_meal_price, total_amount, reservation_status, stripe_payment_intent_id, payment_amount,
        payment_status, payment_method, coupon_code, affiliate_id, pending_count, sync_status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,
        $14,$15,$16::jsonb,$17,$18,$19,
        $20,$21,$22::jsonb,$23::jsonb,$24,$25,
        $26,$27,$28,$29,$30,
        $31,$32,$33,$34,$35,$36
      ) RETURNING id, reservation_number`,
      [
        reservationNumber,
        r.name,
        r.name_kana || '',
        r.email,
        r.gender || 'male',
        r.birth_date || '1990-01-01',
        r.phone_number || '',
        r.postal_code || '',
        r.prefecture || '',
        r.city_address || '',
        r.building_name ?? null,
        r.past_stay ?? false,
        r.check_in_date,
        nights,
        units,
        JSON.stringify(a.guestCounts ?? {}),
        normalizeCheckInTime(r.estimated_check_in_time) ?? '15:00',
        r.purpose || 'travel',
        r.special_requests ?? null,
        r.transportation_method || 'car',
        amounts.roomTotal,
        JSON.stringify(amounts.roomRates),
        JSON.stringify(a.mealPlans ?? {}),
        a.totalGuests,
        a.guestsWithMeals,
        amounts.mealTotal,
        amounts.totalAmount,
        'confirmed',
        null,
        amounts.paymentAmount,
        'pending',
        'onsite',
        a.body.couponCode ?? null,
        a.affiliateId,
        0,
        // sync_status: CHECK制約上の許可値は pending/complete/failed/processing。
        // 'complete' は再送cron（pending/failed のみ対象）に拾われず FastAPI 二重送信を防ぐ。
        'complete',
      ]
    );
    const newRow = insert.rows[0];

    // 5. クーポン消込（使い回しは消込まない）
    if (a.coupon && !a.coupon.is_reusable) {
      await client.query('UPDATE coupons SET is_used = true WHERE id = $1', [a.coupon.id]);
    }

    // 6. 監査ログ
    await client.query(
      `INSERT INTO admin_rebooking_logs (
        operator, old_reservation_id, old_reservation_number,
        new_reservation_id, new_reservation_number, coupon_code, total_amount, payment_amount
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        a.operator,
        old.id,
        old.reservation_number,
        newRow.id,
        newRow.reservation_number,
        a.body.couponCode ?? null,
        amounts.totalAmount,
        amounts.paymentAmount,
      ]
    );

    await client.query('COMMIT');
    return { newReservationId: newRow.id, newReservationNumber: newRow.reservation_number };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}
