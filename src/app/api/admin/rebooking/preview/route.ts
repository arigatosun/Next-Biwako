// src/app/api/admin/rebooking/preview/route.ts
// 確定前に、客向け／管理者向けメールの文面を実コンポーネントで描画して返す（DB書き込みなし）。
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  computeReservationAmounts,
  buildMealPlans,
  type MealSelectionInput,
  type MealSelectionFull,
} from '@/lib/pricing';
import { renderRebookingEmails } from '@/lib/emailPreview';

export const dynamic = 'force-dynamic';

const PLAN_NAME = '【一棟貸切】贅沢選びつくしヴィラプラン';

interface PreviewReservation {
  name?: string;
  email?: string;
  phone_number?: string;
  check_in_date?: string;
  num_nights?: number;
  num_units?: number;
  guest_counts?: Record<string, unknown>;
  purpose?: string;
  special_requests?: string | null;
  past_stay?: boolean;
  mealSelections?: MealSelectionFull[];
  meal_plans?: Record<string, unknown>;
  roomTotalOverride?: number | null;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as { reservation?: PreviewReservation; couponCode?: string | null };
    const r = body.reservation;
    if (!r || !r.check_in_date) {
      return NextResponse.json({ error: 'reservation.check_in_date は必須です' }, { status: 400 });
    }
    const nights = Number(r.num_nights) || 1;
    const units = Number(r.num_units) || 1;

    // クーポン（割引後金額の表示用・読み取りのみ）
    let coupon: { discount_rate: number | null; discount_amount: number | null } | null = null;
    if (body.couponCode) {
      const { data } = await supabaseAdmin
        .from('coupons')
        .select('discount_rate, discount_amount')
        .eq('coupon_code', body.couponCode)
        .single();
      if (data) coupon = { discount_rate: data.discount_rate, discount_amount: data.discount_amount };
    }

    const mealSelections: MealSelectionInput[] = (r.mealSelections ?? []).map((m) => ({
      planId: m.planId,
      count: Number(m.count) || 0,
    }));
    const amounts = computeReservationAmounts({
      checkInDate: r.check_in_date,
      nights,
      units,
      mealSelections,
      coupon,
      roomTotalOverride: r.roomTotalOverride ?? null,
    });
    const mealPlans = r.meal_plans ?? buildMealPlans(r.mealSelections ?? []);

    const { guestHtml, adminHtml } = await renderRebookingEmails({
      guestName: r.name || 'お客様',
      planName: PLAN_NAME,
      checkInDate: r.check_in_date,
      nights,
      units,
      guestCounts: r.guest_counts ?? {},
      guestEmail: r.email || '',
      guestPhone: r.phone_number || '',
      paymentMethod: '現地決済',
      totalAmount: amounts.paymentAmount.toLocaleString(),
      specialRequests: r.special_requests ?? undefined,
      reservationNumber: '（確定後に発番）',
      mealPlans,
      purpose: r.purpose || 'travel',
      pastStay: r.past_stay || false,
    });

    return NextResponse.json({
      guestHtml,
      adminHtml,
      amounts: { paymentAmount: amounts.paymentAmount, discount: amounts.discount },
    });
  } catch (e) {
    console.error('Email preview failed:', e);
    return NextResponse.json({ error: 'プレビュー生成に失敗しました' }, { status: 500 });
  }
}
