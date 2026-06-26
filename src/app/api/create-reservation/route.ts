import { NextRequest, NextResponse } from 'next/server';
import { ReservationInsert } from '@/app/types/supabase';
import { postReservationToFastApi } from '@/lib/reservationSync';

export const runtime = 'nodejs';

// 予約確定後にブラウザから呼ばれる内部API。
// ねっぱん連携用の FastAPI(/create_reservation) へはこのサーバー側から転送し、
// ブラウザが外部 FastAPI を直接叩かないようにする（公開面を自社オリジンに限定する）。
export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: ReservationInsert;
  try {
    payload = (await request.json()) as ReservationInsert;
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const result = await postReservationToFastApi(payload);

  if (!result.success) {
    // FastAPI への送信失敗。予約自体はクライアント側で既に確定済みのため、
    // 予約完了を妨げないよう上流エラー(502)として返す（呼び出し側はこれを握りつぶす）。
    return NextResponse.json(
      { status: 'fastapi_failed', error: result.error },
      { status: 502 },
    );
  }

  return NextResponse.json({ status: 'success', response: result.response });
}
