// app/reservation-completion/page.tsx
import { getReservationById } from '@/utils/database';
import ReservationCompletionContent from '@/app/components/ReservationCompletionContent';
import Layout from '@/app/components/common/Layout';
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
      <Layout>
        <div>Error: 予約IDが指定されていません。</div>
      </Layout>
    );
  }

  let reservation: Reservation | null = null;
  try {
    reservation = await getReservationById(reservationId);
    if (!reservation) {
      return (
        <Layout>
          <div>予約が見つかりません。予約番号をご確認ください。</div>
        </Layout>
      );
    }
  } catch (error: any) {
    console.error('Error fetching reservation:', error);
    return (
      <Layout>
        <div>Error: {error.message || '予約情報の取得に失敗しました。'}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ReservationCompletionContent reservation={reservation} />
    </Layout>
  );
}
