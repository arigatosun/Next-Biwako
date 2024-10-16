// src/app/components/reservation-form/PaymentAndPolicy.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useReservation } from '@/app/contexts/ReservationContext';
import { supabase } from '@/lib/supabaseClient';
import { ReservationInsert } from '@/app/types/supabase';
import { PersonalInfoFormData } from '@/app/components/reservation-form/PersonalInfoForm';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// 追加: FastAPI エンドポイントの定義
const FASTAPI_ENDPOINT = 'http://34.97.214.132:8000/create_reservation';

// 'Coupon' インターフェースをトップレベルに移動
interface Coupon {
  code: string;
  discountRate: number;
  affiliateId: number;
}

interface PaymentAndPolicyProps {
  totalAmount: number;
  onCouponApplied: (discount: number) => void;
  personalInfo: PersonalInfoFormData | null;
  isMobile: boolean;
}

// 追加: 日付をフォーマットする関数
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // 月は0始まりなので+1
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

// 追加: FastAPIにデータを送信する関数
async function sendReservationData(reservationData: ReservationInsert) {
  try {
    const response = await fetch(FASTAPI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservationData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('FastAPI server response:', result);
      alert('NEPPANと予約同期の開始に成功しました。');
    } else {
      console.error('Error from FastAPI server:', result);
      alert('Failed to send reservation data.');
    }
  } catch (error) {
    console.error('Error sending request:', error);
    alert('Failed to send reservation data.');
  }
}

export default function PaymentAndPolicy({
  totalAmount,
  onCouponApplied,
  personalInfo,
  isMobile,
}: PaymentAndPolicyProps) {
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const { state } = useReservation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // 前回の totalAmountAfterDiscount を保持するための useRef を作成
  const prevTotalAmountAfterDiscountRef = useRef<number | null>(null);

  // 割引前の合計金額を計算
  const totalAmountBeforeDiscount =
    state.selectedPrice + state.totalMealPrice;

  // 割引後の合計金額を計算
  const totalAmountAfterDiscount = totalAmountBeforeDiscount - discountAmount;

  useEffect(() => {
    if (paymentMethod === 'credit' && totalAmountAfterDiscount > 0) {
      // 前回の totalAmountAfterDiscount と現在の totalAmountAfterDiscount が異なる場合のみ処理を実行
      if (
        totalAmountAfterDiscount !== prevTotalAmountAfterDiscountRef.current
      ) {
        prevTotalAmountAfterDiscountRef.current = totalAmountAfterDiscount; // 現在の totalAmountAfterDiscount を保存

        // clientSecretを取得
        fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(totalAmountAfterDiscount),
            paymentIntentId, // 既存の PaymentIntent ID を送信
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            setClientSecret(data.clientSecret);
            setPaymentIntentId(data.paymentIntentId); // PaymentIntent ID を保存
          })
          .catch((error) => {
            console.error('Error creating or updating PaymentIntent:', error);
          });
      }
    }
  }, [paymentMethod, totalAmountAfterDiscount, paymentIntentId]);

  const applyCoupon = async () => {
    if (!couponCode) {
      alert('クーポンコードを入力してください。');
      return;
    }
  
    try {
      // Step 1: クーポン情報の取得
      const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .select('discount_rate, affiliate_code')
        .eq('coupon_code', couponCode)
        .single();
  
      if (couponError || !couponData) {
        alert('無効なクーポンコードです。');
        return;
      }
  
      const discountRate = couponData.discount_rate;
      const affiliateCode = couponData.affiliate_code;
  
      // Step 2: アフィリエイトIDの取得
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .single();
  
      if (affiliateError || !affiliateData) {
        alert('アフィリエイト情報の取得に失敗しました。');
        return;
      }
  
      const affiliateId = affiliateData.id;
  
      // 割引額を計算
      const discount = (totalAmountBeforeDiscount * discountRate) / 100;
      setDiscountAmount(discount);
  
      setAppliedCoupon({
        code: couponCode,
        discountRate,
        affiliateId,
      });
  
      onCouponApplied(discount);
      alert(
        `クーポンが適用されました。割引額: ¥${discount.toLocaleString()}`
      );
    } catch (error) {
      console.error('Error applying coupon:', error);
      alert('クーポンの適用中にエラーが発生しました。');
    }
  };

  // 現地決済の処理を実装
  const handleOnsitePayment = async () => {
    if (!personalInfo) {
      alert('個人情報を入力してください。');
      return;
    }

    setLoading(true);

    if (personalInfo.email !== personalInfo.emailConfirm) {
      alert('メールアドレスが一致しません。');
      setLoading(false);
      return;
    }

    const birthDateString = `${personalInfo.birthYear}-${personalInfo.birthMonth}-${personalInfo.birthDay}`;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) {
      alert('生年月日が無効です。');
      setLoading(false);
      return;
    }

    if (!state.selectedDate) {
      alert('チェックイン日が選択されていません。');
      setLoading(false);
      return;
    }

    try {
      const reservationNumber = `RES-${Date.now()}`;
      const totalGuests = state.guestCounts.reduce(
        (sum, gc) =>
          sum + gc.male + gc.female + gc.childWithBed + gc.childNoBed,
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
        // 変更: formatDateLocal 関数を使用してチェックイン日をフォーマット
        check_in_date: formatDateLocal(state.selectedDate),
        num_nights: state.nights,
        num_units: state.units,
        num_male: state.guestCounts.reduce((sum, gc) => sum + gc.male, 0),
        num_female: state.guestCounts.reduce((sum, gc) => sum + gc.female, 0),
        num_child_with_bed: state.guestCounts.reduce(
          (sum, gc) => sum + gc.childWithBed,
          0
        ),
        num_child_no_bed: state.guestCounts.reduce(
          (sum, gc) => sum + gc.childNoBed,
          0
        ),
        estimated_check_in_time: personalInfo.checkInTime,
        purpose: personalInfo.purpose,
        special_requests: personalInfo.notes || null,
        transportation_method: personalInfo.transportation,
        room_rate: state.selectedPrice,
        meal_plans: state.selectedFoodPlans,
        total_guests: totalGuests,
        guests_with_meals: guestsWithMeals,
        total_meal_price: state.totalMealPrice,
        total_amount: totalAmountBeforeDiscount, // 割引前の金額
        payment_amount: totalAmountAfterDiscount, // 割引後の金額
        reservation_status: 'confirmed', // 現地決済の場合は 'confirmed'
        payment_method: 'onsite', // 現地決済
        payment_status: 'pending', // 現地決済の場合は 'pending'
        stripe_payment_intent_id: null,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        affiliate_id: appliedCoupon ? appliedCoupon.affiliateId : null,
      };

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

      // 追加: FastAPIにデータを送信
      await sendReservationData(reservationData);

      window.location.href = `${window.location.origin}/reservation-complete?reservationId=${reservationId}`;
    } catch (err: any) {
      console.error('Error during reservation:', err);
      alert('予約に失敗しました。もう一度お試しください。');
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <>
      <div className={`mb-8 ${isMobile ? 'px-4' : ''}`}>
        <h3 className="bg-gray-800 text-white py-3 text-center text-lg font-bold rounded-md mb-4">
          お支払い方法
        </h3>
        <div
          className={`border-2 ${
            paymentMethod === 'credit'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-300'
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
          <Image
            src="/images/card_5brand.webp"
            alt="Credit Card Brands"
            width={200}
            height={40}
            className="mt-2"
          />
        </div>
        <div
          className={`border-2 ${
            paymentMethod === 'onsite'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-300'
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
          <p className="text-sm text-gray-600 mt-2">
            当日、現地にてご精算ください。
          </p>
        </div>
      </div>

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
          <div className="mt-2 text-sm text-green-600">
            クーポンが適用されました。割引率: {appliedCoupon.discountRate}%
          </div>
        )}
      </div>

      {/* クレジットカード決済フォームの表示 */}
      {paymentMethod === 'credit' && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CreditCardForm
            personalInfo={personalInfo}
            clientSecret={clientSecret}
            paymentIntentId={paymentIntentId}
            loading={loading}
            setLoading={setLoading}
            appliedCoupon={appliedCoupon}
            discountAmount={discountAmount}
            totalAmountBeforeDiscount={totalAmountBeforeDiscount}
            totalAmountAfterDiscount={totalAmountAfterDiscount}
          />
        </Elements>
      )}

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
          <li className="mb-2 text-red-600 relative pl-6">
            <span className="absolute left-0 top-0 text-gray-500">●</span>
            クレジットカード決済でお支払いを行う場合、30日前よりも前のキャンセルでも
          3.6%のキャンセル手数料が発生する可能性があります。
          </li>
        </ul>
      </div>

      {paymentMethod === 'onsite' && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={handleOnsitePayment}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition duration-300"
          >
            {loading ? '処理中...' : '予約を確定する'}
          </button>
        </div>
      )}
    </>
  );
}

interface CreditCardFormProps {
  personalInfo: PersonalInfoFormData | null;
  clientSecret: string;
  paymentIntentId: string | null;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  totalAmountBeforeDiscount: number;
  totalAmountAfterDiscount: number;
}

function CreditCardForm({
  personalInfo,
  clientSecret,
  paymentIntentId,
  loading,
  setLoading,
  appliedCoupon,
  discountAmount,
  totalAmountBeforeDiscount,
  totalAmountAfterDiscount,
}: CreditCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { state } = useReservation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!personalInfo) {
      alert('個人情報を入力してください。');
      return;
    }

    if (!stripe || !elements) {
      alert('Stripeの初期化が完了していません。');
      return;
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
        (sum, gc) =>
          sum + gc.male + gc.female + gc.childWithBed + gc.childNoBed,
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
        // 変更: formatDateLocal 関数を使用してチェックイン日をフォーマット
        check_in_date: formatDateLocal(state.selectedDate),
        num_nights: state.nights,
        num_units: state.units,
        num_male: state.guestCounts.reduce((sum, gc) => sum + gc.male, 0),
        num_female: state.guestCounts.reduce((sum, gc) => sum + gc.female, 0),
        num_child_with_bed: state.guestCounts.reduce(
          (sum, gc) => sum + gc.childWithBed,
          0
        ),
        num_child_no_bed: state.guestCounts.reduce(
          (sum, gc) => sum + gc.childNoBed,
          0
        ),
        estimated_check_in_time: personalInfo.checkInTime,
        purpose: personalInfo.purpose,
        special_requests: personalInfo.notes || null,
        transportation_method: personalInfo.transportation,
        room_rate: state.selectedPrice,
        meal_plans: state.selectedFoodPlans,
        total_guests: totalGuests,
        guests_with_meals: guestsWithMeals,
        total_meal_price: state.totalMealPrice,
        total_amount: totalAmountBeforeDiscount, // 割引前の金額
        payment_amount: totalAmountAfterDiscount, // 割引後の金額
        reservation_status: 'pending',
        payment_method: 'credit', // クレジットカード決済
        payment_status: 'pending', // 決済完了後に更新
        stripe_payment_intent_id: paymentIntentId, // PaymentIntent ID を保存
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        affiliate_id: appliedCoupon ? appliedCoupon.affiliateId : null,
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

      // 追加: FastAPIにデータを送信
      await sendReservationData(reservationData);

      // 決済処理
      const result = await stripe.confirmPayment({
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

      // 決済成功時の処理は return_url で行われます
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
      <div
        style={{
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
        }}
      >
        <PaymentElement />
      </div>
      {appliedCoupon && (
        <div className="mt-4 text-sm">
          <p>適用されたクーポン: {appliedCoupon.code}</p>
          <p>割引額: ¥{discountAmount.toLocaleString()}</p>
          <p>割引後の金額: ¥{totalAmountAfterDiscount.toLocaleString()}</p>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          type="submit"
          disabled={loading || !stripe || !elements}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition duration-300"
        >
          {loading ? '処理中...' : '予約を確定する'}
        </button>
      </div>
    </form>
  );
}