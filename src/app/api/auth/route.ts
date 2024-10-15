import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { reservationNumber, email } = await request.json();

  try {
    console.log(`Attempting login with reservation number: ${reservationNumber} and email: ${email}`);

    const { data, error } = await supabase
      .from('reservations')
      .select('id, reservation_number, email, name')
      .eq('reservation_number', reservationNumber)
      .eq('email', email)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (!data) {
      console.log('No matching reservation found');
      return NextResponse.json({ error: 'Invalid reservation number or email' }, { status: 401 });
    }

    console.log('Reservation found:', data);

    // JWT トークンの生成
    const token = jwt.sign(
      { 
        reservationId: data.id,
        reservationNumber: data.reservation_number,
        email: data.email
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    return NextResponse.json({ token, userName: data.name });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}