// src/lib/emailPreview.tsx
// 予約作り直しで送信されるメール（客向け／管理者向け）を HTML 文字列に描画する。
// 実送信と同じ React Email コンポーネントを使うため、プレビュー＝実際の文面が一致する。
import React from 'react';
import { renderAsync } from '@react-email/render';
import GuestReservationEmail from '@/emails/GuestReservationEmail';
import AdminReservationNotification from '@/emails/AdminReservationNotification';

type GuestCountsProp = React.ComponentProps<typeof AdminReservationNotification>['guestCounts'];
type MealPlansProp = React.ComponentProps<typeof AdminReservationNotification>['mealPlans'];

export interface RebookingEmailPreviewInput {
  guestName: string;
  planName: string;
  checkInDate: string; // YYYY-MM-DD（内部で日本語表記へ整形）
  nights: number;
  units: number;
  guestCounts: Record<string, unknown>;
  guestEmail: string;
  guestPhone: string;
  paymentMethod: string;
  totalAmount: string;
  specialRequests?: string;
  reservationNumber: string;
  mealPlans: Record<string, unknown>;
  purpose: string;
  pastStay?: boolean;
}

function formatDateJa(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function renderRebookingEmails(
  input: RebookingEmailPreviewInput
): Promise<{ guestHtml: string; adminHtml: string }> {
  const checkInDate = formatDateJa(input.checkInDate);
  const guestInfo = { email: input.guestEmail, phone: input.guestPhone };
  // メールコンポーネントの prop 型は未エクスポートのため unknown 経由でナローイングする。
  const guestCounts = input.guestCounts as unknown as GuestCountsProp;
  const mealPlans = input.mealPlans as unknown as MealPlansProp;

  const guestHtml = await renderAsync(
    <GuestReservationEmail
      guestName={input.guestName}
      planName={input.planName}
      checkInDate={checkInDate}
      nights={input.nights}
      units={input.units}
      guestCounts={guestCounts}
      guestInfo={guestInfo}
      paymentMethod={input.paymentMethod}
      totalAmount={input.totalAmount}
      specialRequests={input.specialRequests}
      reservationNumber={input.reservationNumber}
    />
  );

  const adminHtml = await renderAsync(
    <AdminReservationNotification
      guestName={input.guestName}
      planName={input.planName}
      checkInDate={checkInDate}
      nights={input.nights}
      units={input.units}
      guestCounts={guestCounts}
      guestInfo={guestInfo}
      paymentMethod={input.paymentMethod}
      totalAmount={input.totalAmount}
      specialRequests={input.specialRequests}
      reservationNumber={input.reservationNumber}
      mealPlans={mealPlans}
      purpose={input.purpose}
      pastStay={input.pastStay ?? false}
    />
  );

  return { guestHtml, adminHtml };
}
