import { Reservation, ReservationInsert } from '@/app/types/supabase';
import { FASTAPI_CREATE_RESERVATION_ENDPOINT } from './constants';

const FASTAPI_TIMEOUT_MS = 30_000;

export function mapReservationRowToPayload(reservation: any): ReservationInsert {
  // payment_methodの検証
  if (reservation.payment_method !== 'onsite' && reservation.payment_method !== 'credit') {
    throw new Error(`Unsupported payment method for reservation ${reservation.id}: ${reservation.payment_method}`);
  }

  // 必須フィールドの検証
  const requiredFields = ['reservation_number', 'name', 'email', 'check_in_date'];
  for (const field of requiredFields) {
    if (!reservation[field]) {
      throw new Error(`Missing required field '${field}' for reservation ${reservation.id}`);
    }
  }

  return {
    reservation_number: reservation.reservation_number,
    name: reservation.name,
    name_kana: reservation.name_kana || '',
    email: reservation.email,
    gender: reservation.gender || 'male',
    birth_date: reservation.birth_date || '1990-01-01',
    phone_number: reservation.phone_number || '',
    postal_code: reservation.postal_code || '',
    prefecture: reservation.prefecture || '',
    city_address: reservation.city_address || '',
    building_name: reservation.building_name,
    past_stay: reservation.past_stay || false,
    check_in_date: reservation.check_in_date,
    num_nights: reservation.num_nights || 1,
    num_units: reservation.num_units || 1,
    guest_counts: reservation.guest_counts || { male: 1, female: 0, childWithBed: 0, childNoBed: 0 },
    estimated_check_in_time: reservation.estimated_check_in_time 
      ? reservation.estimated_check_in_time.substring(0, 5) // "15:00:00" → "15:00"
      : '15:00',
    purpose: reservation.purpose || 'travel',
    special_requests: reservation.special_requests,
    transportation_method: reservation.transportation_method || 'car',
    room_rate: reservation.room_rate || 0,
    room_rates: reservation.room_rates || [],
    meal_plans: reservation.meal_plans || {},
    total_guests: reservation.total_guests || 1,
    guests_with_meals: reservation.guests_with_meals || 0,
    total_meal_price: reservation.total_meal_price || 0,
    total_amount: reservation.total_amount || 0,
    reservation_status: reservation.reservation_status || 'confirmed',
    stripe_payment_intent_id: reservation.stripe_payment_intent_id,
    payment_amount: reservation.payment_amount,
    payment_status: reservation.payment_status,
    created_at: reservation.created_at,
    payment_method: reservation.payment_method,
    coupon_code: reservation.coupon_code,
    affiliate_id: reservation.affiliate_id,
    pending_count: 0, // リトライ時は0にリセット
    sync_status: 'processing', // リトライ中は processing に設定
  };
}

export async function postReservationToFastApi(payload: ReservationInsert): Promise<{ success: boolean; response?: any; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FASTAPI_TIMEOUT_MS);

  try {
    console.log(`FastAPIへ予約データを送信中: ${payload.reservation_number}`);
    
    const response = await fetch(FASTAPI_CREATE_RESERVATION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const errorMessage = `FastAPI responded with ${response.status}: ${text}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    const result = await response.json().catch(() => ({}));
    console.log(`FastAPI送信成功: ${payload.reservation_number}`, result);
    
    return { success: true, response: result };
  } catch (error: any) {
    const errorMessage = error.name === 'AbortError' 
      ? 'FastAPI request timeout' 
      : `FastAPI request failed: ${error.message}`;
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    clearTimeout(timer);
  }
}
