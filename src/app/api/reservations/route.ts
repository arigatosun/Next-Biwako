// app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reservationId = searchParams.get('reservationId');

  if (!reservationId) {
    return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId) // 予約IDに基づいて検索
      .single();

    if (error || !data) {
      throw new Error('Reservation not found');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 });
  }
}