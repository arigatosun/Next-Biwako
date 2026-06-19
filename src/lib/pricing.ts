// src/lib/pricing.ts
//
// 管理画面「予約作り直し」フロー専用の料金計算ユーティリティ。
// 既存の公開予約フォーム（PlanAndEstimateInfo.tsx / PaymentAndPolicy.tsx）と
// 同一仕様で実装している（v1 では公開フォームは無改修・本utilは管理画面のみ使用）。
//
//   - 宿泊料金 = Σ(日別単価) × 棟数            ※日別単価は roomPrices から日付で引く
//   - 食事料金 = Σ(プラン単価 × 人前)          ※プラン単価は foodPlans から引く
//   - 割引     = 率(%) または 固定額（合計を上限にクランプ）
//
// すべて副作用なしの純関数。料金表に無い日付は missingDates として返し、呼び出し側で
// 手動入力フォールバックを促す（黙って 0 円にしない）。

import { roomPrices } from '@/app/data/roomPrices';
import { foodPlans } from '@/app/data/foodPlans';
import type { RoomRate } from '@/app/types/supabase';

/** 1泊あたりの食事選択（1棟・1日分の1プラン） */
export interface MealSelectionInput {
  planId: string;
  count: number; // 人前
}

/** クーポン情報（料金計算に必要な最小フィールド） */
export interface CouponForCalc {
  discount_rate: number | null;
  discount_amount: number | null;
}

/** 日付（YYYY-MM-DD）から1棟1泊の単価を返す。料金表に無ければ null。 */
export function getRoomPriceForDate(date: string): number | null {
  const found = roomPrices.find((p) => p.date === date);
  return found ? found.price : null;
}

/** YYYY-MM-DD に i 日加算した YYYY-MM-DD を返す（ローカル日付・タイムゾーン非依存）。 */
export function addDaysISO(date: string, i: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + i);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * チェックイン日と泊数から日別料金（room_rates）を組み立てる。
 * 料金表に無い日付は price=0 とし、missingDates に列挙する。
 */
export function buildRoomRates(
  checkInDate: string,
  nights: number
): { roomRates: RoomRate[]; missingDates: string[] } {
  const roomRates: RoomRate[] = [];
  const missingDates: string[] = [];
  for (let i = 0; i < nights; i++) {
    const date = addDaysISO(checkInDate, i);
    const price = getRoomPriceForDate(date);
    if (price === null) {
      missingDates.push(date);
      roomRates.push({ date, price: 0 });
    } else {
      roomRates.push({ date, price });
    }
  }
  return { roomRates, missingDates };
}

/** 宿泊料金合計 = Σ(日別単価) × 棟数 */
export function calcRoomTotal(roomRates: RoomRate[], units: number): number {
  const perUnit = roomRates.reduce((sum, r) => sum + (r.price || 0), 0);
  return perUnit * units;
}

/** プランIDの1人前単価を返す（未知IDは 0）。 */
export function getMealPlanPrice(planId: string): number {
  const plan = foodPlans.find((p) => p.id === planId);
  return plan ? plan.price : 0;
}

/** 1プラン選択分の金額（単価 × 人前）。DB の meal_plans エントリ price と一致する。 */
export function calcMealLineTotal(selection: MealSelectionInput): number {
  return getMealPlanPrice(selection.planId) * (selection.count || 0);
}

/** 食事料金合計（複数選択の合算）。 */
export function calcMealTotal(selections: ReadonlyArray<MealSelectionInput>): number {
  return selections.reduce((sum, s) => sum + calcMealLineTotal(s), 0);
}

/** 棟・日付つきの食事選択（meal_plans 構造の組み立て用）。 */
export interface MealSelectionFull extends MealSelectionInput {
  unitId?: string;
  date?: string;
}

export type MealPlanEntry = { count: number; price: number };
export type MealPlansMap = Record<string, Record<string, Record<string, MealPlanEntry>>>;

/** mealSelections（unitId/date/planId/count）から meal_plans jsonb 構造を組み立てる。 */
export function buildMealPlans(selections: ReadonlyArray<MealSelectionFull>): MealPlansMap {
  const out: MealPlansMap = {};
  for (const s of selections) {
    const unitId = s.unitId || 'unit_1';
    const date = s.date || 'default';
    const count = Number(s.count) || 0;
    if (count <= 0) continue;
    out[unitId] = out[unitId] || {};
    out[unitId][date] = out[unitId][date] || {};
    out[unitId][date][s.planId] = { count, price: getMealPlanPrice(s.planId) * count };
  }
  return out;
}

/**
 * クーポン割引額を計算する（既存公開フローと同一ロジック）。
 *  - discount_rate があれば baseAmount × rate / 100
 *  - なければ discount_amount（固定額）
 *  - いずれも baseAmount を上限にクランプ（負の支払いにしない）
 */
export function calcDiscount(
  coupon: CouponForCalc | null | undefined,
  baseAmount: number
): number {
  if (!coupon) return 0;
  let discount = 0;
  if (coupon.discount_rate !== null && coupon.discount_rate !== undefined) {
    discount = (baseAmount * coupon.discount_rate) / 100;
  } else if (coupon.discount_amount !== null && coupon.discount_amount !== undefined) {
    discount = coupon.discount_amount;
  }
  return Math.min(discount, baseAmount);
}

export interface ComputeAmountsInput {
  checkInDate: string;
  nights: number;
  units: number;
  mealSelections?: ReadonlyArray<MealSelectionInput>;
  coupon?: CouponForCalc | null;
  /** 料金表外などで宿泊料金を手動上書きする場合（棟数込みの合計）。 */
  roomTotalOverride?: number | null;
}

export interface ComputeAmountsResult {
  roomRates: RoomRate[];
  roomTotal: number;
  mealTotal: number;
  /** 割引前合計（total_amount に対応） */
  totalAmount: number;
  discount: number;
  /** 割引後合計（payment_amount に対応・現地決済） */
  paymentAmount: number;
  /** 料金表に無く自動計算できなかった日付。空でなければUIで手動入力を促す。 */
  missingDates: string[];
}

/**
 * 予約1件分の金額一式を計算する。reservations 行の
 * room_rate / room_rates / total_meal_price / total_amount / payment_amount に対応する値を返す。
 */
export function computeReservationAmounts(input: ComputeAmountsInput): ComputeAmountsResult {
  const { roomRates, missingDates } = buildRoomRates(input.checkInDate, input.nights);
  const roomTotal =
    input.roomTotalOverride !== null && input.roomTotalOverride !== undefined
      ? input.roomTotalOverride
      : calcRoomTotal(roomRates, input.units);
  const mealTotal = calcMealTotal(input.mealSelections ?? []);
  const totalAmount = roomTotal + mealTotal;
  const discount = calcDiscount(input.coupon ?? null, totalAmount);
  const paymentAmount = totalAmount - discount;
  return {
    roomRates,
    roomTotal,
    mealTotal,
    totalAmount,
    discount,
    paymentAmount,
    missingDates,
  };
}
