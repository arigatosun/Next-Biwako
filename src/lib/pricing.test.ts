import { describe, it, expect } from 'vitest';
import {
  getRoomPriceForDate,
  addDaysISO,
  buildRoomRates,
  calcRoomTotal,
  getMealPlanPrice,
  calcMealLineTotal,
  calcMealTotal,
  calcDiscount,
  computeReservationAmounts,
} from './pricing';

describe('getRoomPriceForDate', () => {
  it('料金表に存在する日付の単価を返す', () => {
    expect(getRoomPriceForDate('2025-04-01')).toBe(88000);
    expect(getRoomPriceForDate('2025-04-06')).toBe(78000);
    expect(getRoomPriceForDate('2025-04-07')).toBe(68000);
  });

  it('料金表に存在しない日付は null を返す', () => {
    expect(getRoomPriceForDate('2027-01-01')).toBeNull();
  });
});

describe('addDaysISO', () => {
  it('月跨ぎを正しく加算する', () => {
    expect(addDaysISO('2025-04-30', 1)).toBe('2025-05-01');
  });

  it('0日加算は同日を返す', () => {
    expect(addDaysISO('2025-04-06', 0)).toBe('2025-04-06');
  });

  it('年跨ぎを正しく加算する', () => {
    expect(addDaysISO('2025-12-31', 1)).toBe('2026-01-01');
  });
});

describe('buildRoomRates', () => {
  it('連泊の日別料金を組み立てる', () => {
    const { roomRates, missingDates } = buildRoomRates('2025-04-06', 2);
    expect(roomRates).toEqual([
      { date: '2025-04-06', price: 78000 },
      { date: '2025-04-07', price: 68000 },
    ]);
    expect(missingDates).toEqual([]);
  });

  it('料金表に無い日付は price=0 とし missingDates に列挙する', () => {
    const { roomRates, missingDates } = buildRoomRates('2027-01-01', 1);
    expect(roomRates).toEqual([{ date: '2027-01-01', price: 0 }]);
    expect(missingDates).toEqual(['2027-01-01']);
  });
});

describe('calcRoomTotal', () => {
  it('宿泊料金 = Σ(日別単価) × 棟数', () => {
    const rates = [
      { date: '2025-04-06', price: 78000 },
      { date: '2025-04-07', price: 68000 },
    ];
    expect(calcRoomTotal(rates, 1)).toBe(146000);
    expect(calcRoomTotal(rates, 2)).toBe(292000);
  });
});

describe('getMealPlanPrice / calcMealLineTotal / calcMealTotal', () => {
  it('プランIDから1人前単価を返す', () => {
    expect(getMealPlanPrice('plan-a')).toBe(6500);
    expect(getMealPlanPrice('plan-c')).toBe(3000);
    expect(getMealPlanPrice('no-meal')).toBe(0);
  });

  it('未知のプランIDは 0 を返す', () => {
    expect(getMealPlanPrice('unknown-plan')).toBe(0);
  });

  it('1プランの金額 = 単価 × 人前', () => {
    expect(calcMealLineTotal({ planId: 'plan-a', count: 5 })).toBe(32500);
  });

  it('複数プランの食事料金を合算する', () => {
    const total = calcMealTotal([
      { planId: 'plan-a', count: 5 },
      { planId: 'plan-c', count: 5 },
    ]);
    expect(total).toBe(47500);
  });

  it('選択なしは 0', () => {
    expect(calcMealTotal([])).toBe(0);
  });
});

describe('calcDiscount', () => {
  it('率割引は baseAmount × rate / 100', () => {
    expect(calcDiscount({ discount_rate: 10, discount_amount: null }, 100000)).toBe(10000);
  });

  it('固定額割引はその金額', () => {
    expect(calcDiscount({ discount_rate: null, discount_amount: 5000 }, 100000)).toBe(5000);
  });

  it('割引額は合計を上限にクランプする', () => {
    expect(calcDiscount({ discount_rate: null, discount_amount: 50000 }, 30000)).toBe(30000);
  });

  it('クーポンなしは 0', () => {
    expect(calcDiscount(null, 100000)).toBe(0);
  });
});

describe('computeReservationAmounts', () => {
  it('宿泊+食事+クーポンを合算し割引後金額を返す', () => {
    const result = computeReservationAmounts({
      checkInDate: '2025-04-06',
      nights: 2,
      units: 2,
      mealSelections: [{ planId: 'plan-a', count: 5 }],
      coupon: { discount_rate: null, discount_amount: 5000 },
    });
    expect(result.roomTotal).toBe(292000);
    expect(result.mealTotal).toBe(32500);
    expect(result.totalAmount).toBe(324500);
    expect(result.discount).toBe(5000);
    expect(result.paymentAmount).toBe(319500);
    expect(result.missingDates).toEqual([]);
    expect(result.roomRates).toHaveLength(2);
  });

  it('料金表外の日付は missingDates を返し手動上書きが使える', () => {
    const auto = computeReservationAmounts({
      checkInDate: '2027-01-01',
      nights: 1,
      units: 1,
    });
    expect(auto.missingDates).toEqual(['2027-01-01']);
    expect(auto.roomTotal).toBe(0);

    const overridden = computeReservationAmounts({
      checkInDate: '2027-01-01',
      nights: 1,
      units: 1,
      roomTotalOverride: 90000,
    });
    expect(overridden.roomTotal).toBe(90000);
    expect(overridden.totalAmount).toBe(90000);
    expect(overridden.paymentAmount).toBe(90000);
  });

  it('クーポンなしは割引0・支払額=合計', () => {
    const result = computeReservationAmounts({
      checkInDate: '2025-04-06',
      nights: 1,
      units: 1,
    });
    expect(result.discount).toBe(0);
    expect(result.paymentAmount).toBe(result.totalAmount);
    expect(result.totalAmount).toBe(78000);
  });
});
