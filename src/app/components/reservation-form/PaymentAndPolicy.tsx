// src/app/components/reservation-form/PaymentAndPolicy.tsx

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useReservation } from '@/app/contexts/ReservationContext';
import { supabase } from '@/lib/supabaseClient';
import { ReservationInsert } from '@/app/types/supabase';
import { PersonalInfoFormData } from './PersonalInfoForm';

interface PaymentAndPolicyProps {
  totalAmount: number;
  onCouponApplied: (discount: number) => void;
  personalInfo: PersonalInfoFormData | null;
  clientSecret: string | null;
}

export default function PaymentAndPolicy({
  totalAmount,
  onCouponApplied,
  personalInfo,
  clientSecret,
}: PaymentAndPolicyProps) {
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const { state } = useReservation();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState('');

  interface Coupon {
    code: string;
    discount: number;
    description: string;
  }

  const applyCoupon = () => {
    // モックのクーポンデータ
    const mockCoupons: { [key: string]: Coupon } = {
      SUMMER10: { code: 'SUMMER10', discount: 0.1, description: '10% OFF夏季割引' },
      WELCOME20: { code: 'WELCOME20', discount: 0.2, description: '20% OFFウェルカム割引' },
    };

    const coupon = mockCoupons[couponCode.toUpperCase()];
    if (coupon) {
      setAppliedCoupon(coupon);
      const discountAmount = coupon.discount * totalAmount;
      onCouponApplied(discountAmount);
    } else {
      alert('無効なクーポンコードです。');
    }
    setCouponCode('');
  };

  const handleSubmit = async () => {
    if (!personalInfo) {
      alert('個人情報を入力してください。');
      return;
    }

    if (paymentMethod === 'credit') {
      if (!stripe || !elements) {
        alert('Stripeの初期化が完了していません。');
        return;
      }
    }

    setLoading(true);

    // メールアドレスの確認
    if (personalInfo.email !== personalInfo.emailConfirm) {
      alert('メールアドレスが一致しません。');
      setLoading(false);
      return;
    }

    // 生年月日の作成と検証
    const birthDateString = `${personalInfo.birthYear}-${personalInfo.birthMonth}-${personalInfo.birthDay}`;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) {
      alert('生年月日が無効です。');
      setLoading(false);
      return;
    }

    // チェックイン日の検証
    if (!state.selectedDate) {
      alert('チェックイン日が選択されていません。');
      setLoading(false);
      return;
    }

    try {
      // 予約番号の生成
      const reservationNumber = `RES-${Date.now()}`;

      // ゲストの合計人数を計算
      const totalGuests = state.guestCounts.reduce(
        (sum, gc) => sum + gc.male + gc.female + gc.childWithBed + gc.childNoBed,
        0
      );

      // 食事プランを選択したゲストの人数を計算
      const guestsWithMeals = Object.values(state.selectedFoodPlans).reduce((sum, fp) => sum + fp.count, 0);

      // 予約情報の作成
      const reservationData: ReservationInsert = {
        reservation_number: reservationNumber,
        name: `${personalInfo.lastName} ${personalInfo.firstName}`,
        name_kana: `${personalInfo.lastNameKana} ${personalInfo.firstNameKana}`,
        email: personalInfo.email,
        gender: personalInfo.gender,
        birth_date: birthDateString,
        phone_number: personalInfo.phone,
        postal_code: personalInfo.postalCode,
        prefecture: personalInfo.prefecture,
        city_address: personalInfo.address,
        building_name: personalInfo.buildingName || null,
        past_stay: personalInfo.pastStay === 'repeat',
        check_in_date: state.selectedDate.toISOString().split('T')[0],
        num_nights: state.nights,
        num_units: state.units,
        num_male: state.guestCounts.reduce((sum, gc) => sum + gc.male, 0),
        num_female: state.guestCounts.reduce((sum, gc) => sum + gc.female, 0),
        num_child_with_bed: state.guestCounts.reduce((sum, gc) => sum + gc.childWithBed, 0),
        num_child_no_bed: state.guestCounts.reduce((sum, gc) => sum + gc.childNoBed, 0),
        estimated_check_in_time: personalInfo.checkInTime,
        purpose: personalInfo.purpose,
        special_requests: personalInfo.notes || null,
        transportation_method: personalInfo.transportation,
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

      // Supabaseに予約情報を保存
      const { data: reservationResult, error } = await supabase
        .from('reservations')
        .insert([reservationData])
        .select();

      if (error) {
        throw error;
      }

      if (!reservationResult || reservationResult.length === 0) {
        throw new Error('予約の保存に失敗しました');
      }

      const reservationId = reservationResult[0].id;

      if (paymentMethod === 'credit') {
        // 決済処理
        if (!elements) {
          alert('決済情報が正しく入力されていません。');
          setLoading(false);
          return;
        }

        const result = await stripe!.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/reservation-complete?reservationId=${reservationId}`,
          },
        });

        if (result.error) {
          // 決済エラー時の処理
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
      } else {
        // 現地決済の場合、直接完了ページへリダイレクト
        window.location.href = `${window.location.origin}/reservation-complete?reservationId=${reservationId}`;
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error during reservation or payment:', err);
      alert('予約またはお支払いに失敗しました。もう一度お試しください。');
      setLoading(false);
      return;
    }
  };

  return (
    <>
      <div className="mb-8">
        <h3 className="bg-gray-800 text-white py-3 text-center text-lg font-bold rounded-md mb-4">
          お支払い方法
        </h3>
        <div
          className={`border-2 ${
            paymentMethod === 'credit' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-300'
          } rounded-md p-4 mb-4 cursor-pointer transition-all duration-300`}
          onClick={() => setPaymentMethod('credit')}
        >
          <div className="flex items-center">
            <input
              type="radio"
              id="credit"
              name="payment"
              value="credit"
              checked={paymentMethod === 'credit'}
              onChange={() => setPaymentMethod('credit')}
              className="mr-2"
            />
            <label htmlFor="credit" className="font-medium text-gray-600">
              クレジットカードでのオンライン決済
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            こちらのお支払い方法は、株式会社タイムデザインとの手配旅行契約、クレジットカードによる事前決済となります。
            お客様の個人情報をホテペイの運営会社である株式会社タイムデザインに提供いたします。
          </p>
          <Image src="/images/card_5brand.webp" alt="Credit Card Brands" width={200} height={40} className="mt-2" />
        </div>
        <div
          className={`border-2 ${
            paymentMethod === 'onsite' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-300'
          } rounded-md p-4 mb-4 cursor-pointer transition-all duration-300`}
          onClick={() => setPaymentMethod('onsite')}
        >
          <div className="flex items-center">
            <input
              type="radio"
              id="onsite"
              name="payment"
              value="onsite"
              checked={paymentMethod === 'onsite'}
              onChange={() => setPaymentMethod('onsite')}
              className="mr-2"
            />
            <label htmlFor="onsite" className="font-medium text-gray-600">
              現地決済
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-2">当日、現地にてご精算ください。</p>
        </div>
      </div>

      {/* クレジットカード決済フォームの表示 */}
      {paymentMethod === 'credit' && clientSecret && (
        <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <PaymentElement />
        </div>
      )}

      {/* クーポンコードセクション */}
      <div className="mt-7 mb-6 border-2 border-gray-300 rounded-md p-4">
        <h4 className="font-medium text-gray-600 mb-2">クーポンコード</h4>
        <div className="flex">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="クーポンコードを入力"
            className="flex-grow border rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={applyCoupon}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition duration-300"
          >
            適用
          </button>
        </div>
        {appliedCoupon && (
          <div className="mt-2 text-sm text-green-600">適用済みクーポン: {appliedCoupon.description}</div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="bg-gray-800 text-white py-4 text-center text-lg font-bold rounded-md mb-4">
          キャンセルポリシー
        </h3>
        <ul className="list-none pl-1">
          <li className="mb-2 text-gray-700 relative pl-6">
            <span className="absolute left-0 top-0 text-gray-500">●</span>
            宿泊日から30日前〜 宿泊料金（食事・オプション等含）の50%
          </li>
          <li className="mb-2 text-gray-700 relative pl-6">
            <span className="absolute left-0 top-0 text-gray-500">●</span>
            宿泊日から7日前〜 宿泊料金（食事・オプション等含）の100%
          </li>
        </ul>
      </div>

      {/* フォーム送信ボタン */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition duration-300"
        >
          {loading ? '処理中...' : '予約を確定する'}
        </button>
      </div>
    </>
  );
}
