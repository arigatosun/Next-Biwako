// app/utils/database.ts
import { supabase } from '@/lib/supabaseClient';
import { Reservation } from '@/app/types/supabase';

export async function getReservationById(reservationId: string): Promise<Reservation | null> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Reservation;
}
