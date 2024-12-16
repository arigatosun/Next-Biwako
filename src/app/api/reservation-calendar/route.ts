// src/app/api/reservation-calendar/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database, Reservation } from '@/app/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('check_in_date, num_nights, num_units, reservation_status')
     
      .lte('check_in_date', endDate);

    if (error) throw error;

    const totalUnitsPerDay = 2; // 1日の総ユニット数
    const reservationCounts: Record<string, { totalReserved: number; available: number }> = {};

    (data as Reservation[]).forEach((reservation) => {
      const checkInDate = new Date(reservation.check_in_date);
      for (let i = 0; i < reservation.num_nights; i++) {
        const date = new Date(checkInDate);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        if (!reservationCounts[dateString]) {
          reservationCounts[dateString] = { totalReserved: 0, available: totalUnitsPerDay };
        }

        if (['pending', 'confirmed', 'paid', 'processing'].includes(reservation.reservation_status)) {
          reservationCounts[dateString].totalReserved += reservation.num_units;
        }
      }
    });

    // 予約数に基づいて available を再計算
    for (const dateString in reservationCounts) {
      const totalReserved = reservationCounts[dateString].totalReserved;
      reservationCounts[dateString].available = Math.max(0, totalUnitsPerDay - totalReserved);
    }

    return NextResponse.json(reservationCounts);
  } catch (error) {
    console.error('Error fetching reservation calendar data:', error);
    return NextResponse.json({ error: 'Failed to fetch reservation calendar data' }, { status: 500 });
  }
}
