'use client';

import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useReservation } from '@/app/contexts/ReservationContext';
import { ReservationInsert } from '@/app/types/supabase';
import { PersonalInfoFormData } from '@/app/contexts/ReservationContext';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { state } = useReservation();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // state.personalInfo が正しく設定されているかチェック
      if (!state.personalInfo) {
        alert('個人情報が入力されていません。予約情報入力画面に戻ってください。');
        router.push('/reservation-form');
        return;
      }

      // 必要なフィールドを定義
      const requiredFields: (keyof PersonalInfoFormData)[] = [
        'lastName',
        'firstName',
        'lastNameKana',
        'firstNameKana',
        'email',
        'gender',
        'birthYear',
        'birthMonth',
        'birthDay',
        'phone',
        'postalCode',
        'prefecture',
        'address',
        'transportation',
        'checkInTime',
        'purpose',
      ];

      // フィールドの存在を確認
      for (const field of requiredFields) {
        if (!state.personalInfo[field]) {
          alert(`個人情報の「${field}」が入力されていません。予約情報入力画面に戻ってください。`);
          router.push('/reservation-form');
          return;
        }
      }

      // 生年月日の作成と検証
      const birthDateString = `${state.personalInfo.birthYear}-${state.personalInfo.birthMonth}-${state.personalInfo.birthDay}`;
      const birthDate = new Date(birthDateString);
      if (isNaN(birthDate.getTime())) {
        alert('生年月日が無効です。予約情報入力画面に戻ってください。');
        router.push('/reservation-form');
        return;
      }

      // チェックイン日の検証
      if (!state.selectedDate) {
        alert('チェックイン日が選択されていません。予約情報入力画面に戻ってください。');
        router.push('/reservation-form');
        return;
      }

      // 予約番号の生成
      const reservationNumber = `RES-${Date.now()}`;

      // ゲストの合計人数を計算
      const totalGuests = state.guestCounts.reduce(
        (sum, gc) => sum + gc.male + gc.female + gc.childWithBed + gc.childNoBed,
        0
      );

      // 食事プランを選択したゲストの人数を計算
      const guestsWithMeals = Object.values(state.selectedFoodPlans).reduce(
        (sum, fp) => sum + fp.count,
        0
      );

      // 予約情報の作成
      const reservationData: ReservationInsert = {
        reservation_number: reservationNumber,
        name: `${state.personalInfo.lastName} ${state.personalInfo.firstName}`,
        name_kana: `${state.personalInfo.lastNameKana} ${state.personalInfo.firstNameKana}`,
        email: state.personalInfo.email,
        gender: state.personalInfo.gender,
        birth_date: birthDateString,
        phone_number: state.personalInfo.phone,
        postal_code: state.personalInfo.postalCode,
        prefecture: state.personalInfo.prefecture,
        city_address: state.personalInfo.address,
        building_name: state.personalInfo.buildingName || null,
        past_stay: state.personalInfo.pastStay === 'repeat',
        check_in_date: state.selectedDate.toISOString().split('T')[0],
        num_nights: state.nights,
        num_units: state.units,
        num_male: state.guestCounts.reduce((sum, gc) => sum + gc.male, 0),
        num_female: state.guestCounts.reduce((sum, gc) => sum + gc.female, 0),
        num_child_with_bed: state.guestCounts.reduce((sum, gc) => sum + gc.childWithBed, 0),
        num_child_no_bed: state.guestCounts.reduce((sum, gc) => sum + gc.childNoBed, 0),
        estimated_check_in_time: state.personalInfo.checkInTime,
        purpose: state.personalInfo.purpose,
        special_requests: state.personalInfo.notes || null,
        transportation_method: state.personalInfo.transportation,
        room_rate: state.totalPrice,
        meal_plans: state.selectedFoodPlans,
        total_guests: totalGuests,
        guests_with_meals: guestsWithMeals,
        total_meal_price: 0, // 必要に応じて計算
        total_amount: state.totalPrice,
        reservation_status: 'pending',
        stripe_payment_intent_id: null,
        payment_amount: null,
        payment_status: 'pending',
      };

      // 予約データをコンソールに出力（デバッグ用）
      console.log('Reservation Data:', reservationData);

      // Supabaseに予約情報を保存
      const { data, error } = await supabase
        .from('reservations')
        .insert([reservationData])
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('予約の保存に失敗しました');
      }

      const reservationId = data[0].id;

      // 2. 決済を処理
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/reservation-complete?reservationId=${reservationId}`,
        },
      });

      if (result.error) {
        // 決済エラーの場合
        console.error('Payment error:', result.error);
        alert('お支払いに失敗しました。もう一度お試しください。');

        // 予約ステータスをキャンセルに更新
        await supabase
          .from('reservations')
          .update({ reservation_status: 'cancelled', payment_status: 'failed' })
          .eq('id', reservationId);

        setLoading(false);
        return;
      }

      // 決済が成功した場合の処理は return_url で行われます

    } catch (err: any) {
      console.error('Error during reservation or payment:', err);
      alert('予約またはお支払いに失敗しました。もう一度お試しください。');
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? '処理中...' : '予約を確定する'}
      </button>
    </form>
  );
}
