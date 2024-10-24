import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/app/types/supabase';

function parseAuthToken(token: string): { reservationNumber: string; email: string } | null {
  try {
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
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    const { data: rawData, error } = await supabase
      .from('reservations')
      .select(`
        id,
        reservation_number,
        name,
        name_kana,
        email,
        gender,
        birth_date,
        phone_number,
        postal_code,
        prefecture,
        city_address,
        building_name,
        past_stay,
        check_in_date,
        num_nights,
        num_units,
        estimated_check_in_time,
        purpose,
        special_requests,
        transportation_method,
        room_rate,
        meal_plans,
        total_guests,
        guests_with_meals,
        total_meal_price,
        total_amount,
        reservation_status,
        stripe_payment_intent_id,
        payment_amount,
        payment_status,
        created_at,
        payment_method,
        coupon_code,
        affiliate_id,
        room_rates,
        guest_counts
      `)
      .eq('reservation_number', reservationNumber)
      .eq('email', email)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to fetch reservation');
    }

    if (!rawData) {
      throw new Error('Reservation not found');
    }

    // jsonbフィールドの処理とデフォルト値の設定
    const processedData = {
      ...rawData,
      guest_counts: rawData.guest_counts || {},
      meal_plans: rawData.meal_plans || {},
      room_rates: rawData.room_rates || []
    };

    // データの整合性チェックとログ
    console.log('Processed reservation data:', {
      reservation_number: processedData.reservation_number,
      total_guests: processedData.total_guests,
      guest_counts: processedData.guest_counts,
      meal_plans: processedData.meal_plans
    });

    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reservation', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}