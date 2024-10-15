// app/api/save-reservation/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// データベース接続プールの作成
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const reservationData = await request.json();

    // 予約番号の生成（例としてUUIDを使用）
    const reservationNumber = `RES-${Date.now()}`;

    // データベースに予約情報を挿入
    const result = await pool.query(
      `INSERT INTO reservations (
        reservation_number, name, name_kana, email, gender, birth_date, phone_number,
        postal_code, prefecture, city_address, building_name, past_stay, check_in_date,
        num_nights, num_units, num_male, num_female, num_child_with_bed, num_child_no_bed,
        estimated_check_in_time, purpose, special_requests, transportation_method,
        room_rate, meal_plans, total_guests, guests_with_meals, total_meal_price,
        total_amount, reservation_status, stripe_payment_intent_id, payment_amount,
        payment_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23,
        $24, $25, $26, $27, $28,
        $29, $30, $31, $32,
        $33
      ) RETURNING id`,
      [
        reservationNumber,
        reservationData.name,
        reservationData.name_kana,
        reservationData.email,
        reservationData.gender,
        reservationData.birth_date,
        reservationData.phone_number,
        reservationData.postal_code,
        reservationData.prefecture,
        reservationData.city_address,
        reservationData.building_name,
        reservationData.past_stay,
        reservationData.check_in_date,
        reservationData.num_nights,
        reservationData.num_units,
        reservationData.num_male,
        reservationData.num_female,
        reservationData.num_child_with_bed,
        reservationData.num_child_no_bed,
        reservationData.estimated_check_in_time,
        reservationData.purpose,
        reservationData.special_requests,
        reservationData.transportation_method,
        reservationData.room_rate,
        JSON.stringify(reservationData.meal_plans),
        reservationData.total_guests,
        reservationData.guests_with_meals,
        reservationData.total_meal_price,
        reservationData.total_amount,
        'confirmed', // 予約ステータス
        reservationData.paymentIntentId,
        reservationData.payment_amount,
        'succeeded', // 支払いステータス
      ]
    );

    return NextResponse.json({ reservationId: result.rows[0].id });
  } catch (error) {
    console.error('Error saving reservation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
