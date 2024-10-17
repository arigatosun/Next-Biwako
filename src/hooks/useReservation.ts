import { useState, useEffect } from 'react';
import { Reservation } from '@/app/types/supabase';
import { getSupabase } from '@/lib/supabase';

export function useReservation(reservationNumber: string) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReservation() {
      if (!reservationNumber) {
        setLoading(false);
        return;
      }

      console.log('Fetching reservation:', reservationNumber);
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('reservation_number', reservationNumber)
          .single();

        if (error) throw error;
        console.log('Fetched reservation:', data);
        setReservation(data);
      } catch (error) {
        console.error('Error fetching reservation:', error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchReservation();
  }, [reservationNumber]);

  return { reservation, loading, error };
}