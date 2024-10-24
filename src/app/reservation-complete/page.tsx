// app/reservation-complete/page.tsx
import { getReservationById } from '@/utils/database';
import ReservationCompletionContent from '@/app/components/ReservationCompletionContent';
import { Reservation } from '@/app/types/supabase';

interface ReservationCompletionPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ReservationCompletionPage({ searchParams }: ReservationCompletionPageProps) {
  const reservationId = Array.isArray(searchParams?.reservationId)
    ? searchParams.reservationId[0]
    : searchParams?.reservationId;

  if (!reservationId) {
    return (
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8 max-w-7xl">
        <div>Error: 予約IDが指定されていません。</div>
      </div>
    );
  }

  let reservation: Reservation | null = null;
  try {
    reservation = await getReservationById(reservationId);
    if (!reservation) {
      return (
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8 max-w-7xl">
          <div>予約が見つかりません。予約番号をご確認ください。</div>
        </div>
      );
    }
  } catch (error: any) {
    console.error('Error fetching reservation:', error);
    return (
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8 max-w-7xl">
        <div>Error: {error.message || '予約情報の取得に失敗しました。'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8 max-w-7xl">
      <ReservationCompletionContent reservation={reservation} />
    </div>
  );
}
