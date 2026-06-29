export interface GuestCountsByDate {
  [unit: string]: {
    [date: string]: {
      num_male: number;
      num_female: number;
      num_child_with_bed: number;
      num_child_no_bed: number;
    };
  };
}

export interface GuestTotals {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

/**
 * 予約全体の合計人数を算出する。
 *
 * guest_counts は「棟 × 宿泊日」ごとに同じ人数を複製保存しているため、
 * 各棟は最初の日付のみを採用し、棟をまたいで合算する。
 * 全日付を加算すると泊数分の二重計上になる（例: 2泊で約2倍）ので注意。
 */
export function calculateTotalGuests(
  guestCounts: GuestCountsByDate | null | undefined
): GuestTotals {
  let male = 0;
  let female = 0;
  let childWithBed = 0;
  let childNoBed = 0;

  if (guestCounts) {
    for (const unit of Object.values(guestCounts)) {
      // 各日付に同じ人数が複製保存されているため、最初の日付のみを使う（泊数分の二重計上を防ぐ）
      const firstDate = Object.values(unit)[0];
      if (!firstDate) continue;
      male += firstDate.num_male || 0;
      female += firstDate.num_female || 0;
      childWithBed += firstDate.num_child_with_bed || 0;
      childNoBed += firstDate.num_child_no_bed || 0;
    }
  }

  return { male, female, childWithBed, childNoBed };
}
