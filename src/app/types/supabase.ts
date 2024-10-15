// src/app/types/supabase.ts

export interface MealPlan {
  count: number;
  menuSelections?: {
    [category: string]: {
      [item: string]: number;
    };
  };
}

export interface Reservation {
  id: number;
  reservation_number: string;
  name: string;
  name_kana: string;
  email: string;
  gender: 'male' | 'female';
  birth_date: string;
  phone_number: string;
  postal_code: string;
  prefecture: string;
  city_address: string;
  building_name?: string;
  past_stay: boolean;
  check_in_date: string;
  num_nights: number;
  num_units: number;
  num_male: number;
  num_female: number;
  num_child_with_bed: number;
  num_child_no_bed: number;
  estimated_check_in_time: string;
  purpose: 'travel' | 'anniversary' | 'birthday_adult' | 'birthday_minor' | 'other';
  special_requests?: string;
  transportation_method: 'car' | 'train' | 'other';
  room_rate: number;
  meal_plans: {
    [planId: string]: MealPlan;
  } | {};
  total_guests: number;
  guests_with_meals: number;
  total_meal_price: number;
  total_amount: number;
  reservation_status: 'pending' | 'confirmed' | 'cancelled';
  stripe_payment_intent_id?: string;
  payment_amount?: number;
  payment_status?: 'pending' | 'succeeded' | 'failed';
  created_at: string;
  updated_at: string;
  payment_method?: 'onsite' | 'credit';
}
  
  export interface ReservationInsert {
    reservation_number: string;
    name: string;
    name_kana: string;
    email: string;
    gender: string;
    birth_date: string;
    phone_number: string;
    postal_code: string;
    prefecture: string;
    city_address: string;
    building_name: string | null;
    past_stay: boolean;
    check_in_date: string;
    num_nights: number;
    num_units: number;
    num_male: number;
    num_female: number;
    num_child_with_bed: number;
    num_child_no_bed: number;
    estimated_check_in_time: string;
    purpose: string;
    special_requests: string | null;
    transportation_method: string;
    room_rate: number;
    meal_plans: { [planId: string]: any };
    total_guests: number;
    guests_with_meals: number;
    total_meal_price: number;
    total_amount: number;
    reservation_status: string;
    stripe_payment_intent_id: string | null;
    payment_amount: number | null;
    payment_status: string | null;
    created_at: string;
    payment_method: 'onsite' | 'credit';
  }
  
  export interface Database {
    public: {
      Tables: {
        reservations: {
          Row: Reservation;
          Insert: ReservationInsert;
          Update: Partial<ReservationInsert>;
        };
        // 他のテーブルがあればここに追加
      };
    };
  }
  