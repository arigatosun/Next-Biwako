// types/supabase.ts

export interface Reservation {
    id: number;
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
    payment_method:string | null;
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
  