import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// ユーティリティ関数を追加してトークンを解析
function parseAuthToken(token: string): { reservationNumber: string; email: string } | null {
  try {
    // ここでは、トークンが "reservationNumber:email" の形式で base64 エンコードされていると仮定します
    const decoded = atob(token);
    const [reservationNumber, email] = decoded.split(':');
    if (reservationNumber && email) {
      return { reservationNumber, email };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authorizationHeader = request.headers.get('Authorization');

  if (!authorizationHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authorizationHeader.replace('Bearer ', '');
  const authData = parseAuthToken(token);

  if (!authData) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { reservationNumber, email } = authData;

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_number', reservationNumber)
      .eq('email', email)
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
