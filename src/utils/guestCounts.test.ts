import { describe, it, expect } from 'vitest';
import { calculateTotalGuests } from './guestCounts';
import type { GuestCountsByDate } from './guestCounts';

const personPerNight = {
  num_male: 2,
  num_female: 1,
  num_child_with_bed: 1,
  num_child_no_bed: 1,
};

describe('calculateTotalGuests', () => {
  it('1棟1泊の人数をそのまま返す', () => {
    const counts: GuestCountsByDate = {
      unit_1: { '2026-07-01': personPerNight },
    };

    expect(calculateTotalGuests(counts)).toEqual({
      male: 2,
      female: 1,
      childWithBed: 1,
      childNoBed: 1,
    });
  });

  it('2泊でも泊数分を二重計上せず1泊分の人数を返す', () => {
    const counts: GuestCountsByDate = {
      unit_1: {
        '2026-07-01': personPerNight,
        '2026-07-02': personPerNight,
      },
    };

    // 2泊でも各日付に同じ人数が複製されているだけなので合計は1泊分と同じ
    expect(calculateTotalGuests(counts)).toEqual({
      male: 2,
      female: 1,
      childWithBed: 1,
      childNoBed: 1,
    });
  });

  it('3泊でも二重計上しない', () => {
    const counts: GuestCountsByDate = {
      unit_1: {
        '2026-07-01': personPerNight,
        '2026-07-02': personPerNight,
        '2026-07-03': personPerNight,
      },
    };

    expect(calculateTotalGuests(counts)).toEqual({
      male: 2,
      female: 1,
      childWithBed: 1,
      childNoBed: 1,
    });
  });

  it('複数棟は棟をまたいで合算する（泊数では二重計上しない）', () => {
    const counts: GuestCountsByDate = {
      unit_1: {
        '2026-07-01': { num_male: 2, num_female: 0, num_child_with_bed: 0, num_child_no_bed: 0 },
        '2026-07-02': { num_male: 2, num_female: 0, num_child_with_bed: 0, num_child_no_bed: 0 },
      },
      unit_2: {
        '2026-07-01': { num_male: 0, num_female: 3, num_child_with_bed: 1, num_child_no_bed: 0 },
        '2026-07-02': { num_male: 0, num_female: 3, num_child_with_bed: 1, num_child_no_bed: 0 },
      },
    };

    expect(calculateTotalGuests(counts)).toEqual({
      male: 2,
      female: 3,
      childWithBed: 1,
      childNoBed: 0,
    });
  });

  it('null/undefined/空オブジェクトは全て0を返す', () => {
    const zero = { male: 0, female: 0, childWithBed: 0, childNoBed: 0 };
    expect(calculateTotalGuests(null)).toEqual(zero);
    expect(calculateTotalGuests(undefined)).toEqual(zero);
    expect(calculateTotalGuests({})).toEqual(zero);
  });

  it('日付エントリのない棟はスキップする', () => {
    const counts: GuestCountsByDate = {
      unit_1: {},
      unit_2: { '2026-07-01': personPerNight },
    };

    expect(calculateTotalGuests(counts)).toEqual({
      male: 2,
      female: 1,
      childWithBed: 1,
      childNoBed: 1,
    });
  });
});
