import { format } from 'date-fns';

/**
 * グループ識別子を生成して再予約時の突合に利用する。
 * メール・チェックイン日・棟数が同じ予約を同一グループとして扱う。
 */
export function buildReservationGroupIdentifier(params: {
  email: string;
  checkInDate: Date;
  units: number;
}): string {
  const normalizedEmail = params.email.trim().toLowerCase();
  const datePart = format(params.checkInDate, 'yyyy-MM-dd');
  return `${normalizedEmail}|${datePart}|${params.units}`;
}
