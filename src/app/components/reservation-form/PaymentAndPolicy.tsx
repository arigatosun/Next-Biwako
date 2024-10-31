"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useReservation } from "@/app/contexts/ReservationContext";
import { supabase } from "@/lib/supabaseClient";
import {
  ReservationInsert,
  GuestCounts,
  MealPlans,
} from "@/app/types/supabase";
import { PersonalInfoFormData } from "@/app/components/reservation-form/PersonalInfoForm";
import { format } from "date-fns";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// FastAPI エンドポイントの定義（必要に応じて更新してください）
const FASTAPI_ENDPOINT = "https://your-fastapi-endpoint.com/create_reservation";

interface Coupon {
  code: string;
  discountRate: number | null;
  discountAmount: number | null;
  affiliateId: number | null;
  id: number;
}

interface PaymentAndPolicyProps {
  totalAmount: number;
  onCouponApplied: (discount: number) => void;
  personalInfo: PersonalInfoFormData | null;
  isMobile: boolean;
  validatePersonalInfo: () => boolean;
}

// 日付をフォーマットする関数
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const day = ("0" + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

// FastAPIにデータを送信する関数
async function sendReservationData(reservationData: ReservationInsert) {
  try {
    const response = await fetch(FASTAPI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reservationData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("FastAPI server response:", result);
    } else {
      console.error("Error from FastAPI server:", result);
    }
  } catch (error) {
    console.error("Error sending request:", error);
  }
}

export default function PaymentAndPolicy({
  totalAmount,
  onCouponApplied,
  personalInfo,
  isMobile,
  validatePersonalInfo,
}: PaymentAndPolicyProps) {
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const { state } = useReservation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // 前回の totalAmountAfterDiscount を保持するための useRef を作成
  const prevTotalAmountAfterDiscountRef = useRef<number | null>(null);

  // 部屋代の合計を計算
  const roomTotal = state.dailyRates.reduce(
    (total, day) => total + day.price * state.units,
    0
  );

  // 食事代の合計を計算
  const mealTotal = Object.entries(state.selectedFoodPlansByUnit || {}).reduce(
    (total, [unitIndex, unitPlans]) => {
      const unitTotal = Object.values(unitPlans).reduce(
        (unitSum, datePlans) =>
          unitSum +
          Object.values(datePlans).reduce(
            (dateSum, plan) => dateSum + (plan.price || 0),
            0
          ),
        0
      );
      return total + unitTotal;
    },
    0
  );

  // 割引前の合計金額を計算
  const totalAmountBeforeDiscount = roomTotal + mealTotal;

  // 割引後の合計金額を計算
  const totalAmountAfterDiscount = totalAmountBeforeDiscount - discountAmount;

  useEffect(() => {
    if (paymentMethod === "credit" && totalAmountAfterDiscount > 0) {
      if (
        totalAmountAfterDiscount !== prevTotalAmountAfterDiscountRef.current
      ) {
        prevTotalAmountAfterDiscountRef.current = totalAmountAfterDiscount;

        // clientSecretを取得
        fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(totalAmountAfterDiscount),
            paymentIntentId,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            setClientSecret(data.clientSecret);
            setPaymentIntentId(data.paymentIntentId);
          })
          .catch((error) => {
            console.error("Error creating or updating PaymentIntent:", error);
          });
      }
    }
  }, [paymentMethod, totalAmountAfterDiscount, paymentIntentId]);

  const applyCoupon = async () => {
    if (!couponCode) {
      alert("クーポンコードを入力してください。");
      return;
    }
  
    try {
      // クーポン情報の取得
      const { data: couponData, error: couponError } = await supabase
        .from("coupons")
        .select("discount_rate, discount_amount, affiliate_code, id, is_used")
        .eq("coupon_code", couponCode)
        .single();
  
      if (couponError || !couponData) {
        alert("無効なクーポンコードです。");
        return;
      }
  
      // クーポンが使用済みかどうかを確認
      if (couponData.is_used) {
        alert("このクーポンはすでに使用されています。");
        return;
      }
  
      let discount = 0;
  
      if (couponData.discount_rate !== null) {
        // 割引率が設定されている場合（パーセンテージ割引）
        discount = (totalAmountBeforeDiscount * couponData.discount_rate) / 100;
      } else if (couponData.discount_amount !== null) {
        // 割引額が設定されている場合（固定金額割引）
        discount = couponData.discount_amount;
      } else {
        alert("無効なクーポンです。");
        return;
      }
  
      // 割引額が合計金額を超えないようにする
      discount = Math.min(discount, totalAmountBeforeDiscount);
  
      // アフィリエイトIDの取得
      let affiliateId = null;
      if (couponData.affiliate_code) {
        const { data: affiliateData, error: affiliateError } = await supabase
          .from("affiliates")
          .select("id")
          .eq("affiliate_code", couponData.affiliate_code)
          .single();
  
        if (affiliateError || !affiliateData) {
          alert("アフィリエイト情報の取得に失敗しました。");
          return;
        }
  
        affiliateId = affiliateData.id;
      }
  
      setDiscountAmount(discount);
  
      setAppliedCoupon({
        code: couponCode,
        discountRate: couponData.discount_rate,
        discountAmount: couponData.discount_amount,
        affiliateId: affiliateId,
        id: couponData.id, // クーポンIDを保持
      });
  
      onCouponApplied(discount);
      alert(`クーポンが適用されました。割引額: ¥${discount.toLocaleString()}`);
    } catch (error) {
      console.error("Error applying coupon:", error);
      alert("クーポンの適用中にエラーが発生しました。");
    }
  };
  

  // 現地決済の処理を修正
  const handleOnsitePayment = async () => {
    // バリデーションを実行
    if (!validatePersonalInfo()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!personalInfo) {
      alert("個人情報を入力してください。");
      return;
    }

    setLoading(true);

    if (personalInfo.email !== personalInfo.emailConfirm) {
      alert("メールアドレスが一致しません。");
      setLoading(false);
      return;
    }

    const birthDateString = `${personalInfo.birthYear}-${personalInfo.birthMonth}-${personalInfo.birthDay}`;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) {
      alert("生年月日が無効です。");
      setLoading(false);
      return;
    }

    if (!state.selectedDate) {
      alert("チェックイン日が選択されていません。");
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
      const guestsWithMeals = Object.values(
        state.selectedFoodPlansByUnit || {}
      ).reduce((sum, unitPlans) => {
        return (
          sum +
          Object.values(unitPlans).reduce((unitSum, datePlans) => {
            return (
              unitSum +
              Object.values(datePlans).reduce(
                (dateSum, plan) => dateSum + plan.count,
                0
              )
            );
          }, 0)
        );
      }, 0);

      // 部屋代の日ごとの内訳を計算
      const roomRates = state.dailyRates.map((day) => ({
        date: formatDateLocal(day.date),
        price: day.price * state.units,
      }));
      // roomTotalは従来通り計算
      const roomTotal = roomRates.reduce((total, day) => total + day.price, 0);

      // guest_counts の作成
      const guest_counts: GuestCounts = {};

      for (let unitIndex = 0; unitIndex < state.units; unitIndex++) {
        const unitId = `unit_${unitIndex + 1}`;
        guest_counts[unitId] = {};
        const guestCount = state.guestCounts[unitIndex];
        for (let i = 0; i < state.nights; i++) {
          const date = new Date(state.selectedDate!);
          date.setDate(date.getDate() + i);
          const dateStr = formatDateLocal(date);
          guest_counts[unitId][dateStr] = {
            num_male: guestCount.male,
            num_female: guestCount.female,
            num_child_with_bed: guestCount.childWithBed,
            num_child_no_bed: guestCount.childNoBed,
          };
        }
      }

      // meal_plans の作成
      const meal_plans: MealPlans = {};

      for (const [unitIndex, unitPlans] of Object.entries(
        state.selectedFoodPlansByUnit || {}
      )) {
        const unitId = `unit_${parseInt(unitIndex) + 1}`;
        meal_plans[unitId] = unitPlans;
      }

      // 「special_requests」の値を設定
      let specialRequestsValue = "";

      if (personalInfo.purposeDetails) {
        specialRequestsValue += personalInfo.purposeDetails + "\n";
      }

      if (personalInfo.notes) {
        specialRequestsValue += personalInfo.notes;
      }

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
        past_stay: personalInfo.pastStay === "repeat",
        check_in_date: formatDateLocal(state.selectedDate),
        num_nights: state.nights,
        num_units: state.units,
        guest_counts,
        estimated_check_in_time: personalInfo.checkInTime,
        purpose: personalInfo.purpose,
        special_requests: specialRequestsValue,
        transportation_method: personalInfo.transportation,
        room_rate: roomTotal,
        room_rates: roomRates,
        meal_plans,
        total_guests: totalGuests,
        guests_with_meals: guestsWithMeals,
        total_meal_price: mealTotal,
        total_amount: totalAmountBeforeDiscount,
        payment_amount: totalAmountAfterDiscount,
        reservation_status: "confirmed",
        payment_method: "onsite",
        payment_status: "pending",
        stripe_payment_intent_id: null,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        affiliate_id: appliedCoupon ? appliedCoupon.affiliateId : null,
      };

      // Supabaseに予約情報を保存
      const { data: reservationResult, error } = await supabase
        .from("reservations")
        .insert([reservationData])
        .select();

      if (error) {
        throw error;
      }

      if (!reservationResult || reservationResult.length === 0) {
        throw new Error("予約の保存に失敗しました");
      }

      const reservationId = reservationResult[0].id;

      // FastAPIにデータを送信
      await sendReservationData(reservationData);

      // メール送信APIにリクエストを送信
      await fetch("/api/send-reservation-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestEmail: personalInfo.email,
          guestName: `${personalInfo.lastName} ${personalInfo.firstName}`,
          adminEmail: "info@nest-biwako.com",
          planName: "【一棟貸切】贅沢選びつくしヴィラプラン",
          roomName: "", // 必要に応じて設定
          checkInDate: formatDateLocal(state.selectedDate),
          nights: state.nights,
          units: state.units,
          guestCounts: guest_counts,
          guestInfo: JSON.stringify({
            email: personalInfo.email,
            phone: personalInfo.phone,
          }),
          paymentMethod: "現地決済",
          totalAmount: totalAmountAfterDiscount.toLocaleString(),
          specialRequests: specialRequestsValue || "",
          reservationNumber: reservationNumber,
          mealPlans: meal_plans,
          purpose: personalInfo.purpose,
        }),
      });

      // 5000円引きクーポンを使用済みに更新
      if (appliedCoupon && appliedCoupon.discountAmount === 5000) {
        const { error: couponError } = await supabase
          .from("coupons")
          .update({ is_used: true })
          .eq("id", appliedCoupon.id);

        if (couponError) {
          console.error("Error updating coupon status:", couponError);
        }
      }

      window.location.href = `${window.location.origin}/reservation-complete?reservationId=${reservationId}`;
    } catch (err: any) {
      console.error("Error during reservation:", err);
      alert("予約に失敗しました。もう一度お試しください。");
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <>
      {/* キャンセルポリシー */}
      <div className="mb-8">
        <h3 className="bg-gray-800 text-white py-4 text-center text-lg font-bold rounded-md mb-4">
          キャンセルポリシー
        </h3>
        <ul className="list-none pl-1 space-y-3">
          <li className="text-gray-700 relative pl-6">
            <span className="absolute left-0 top-0 text-gray-500">●</span>
            チェックイン31日前まで：
            <span className="block pl-6 mt-1">
              - 現地決済の場合：無料
              <br />-
              クレジットカード決済の場合：予約総額の3.6%（クレジットカード決済手数料）
            </span>
          </li>
          <li className="text-gray-700 relative pl-6">
            <span className="absolute left-0 top-0 text-gray-500">●</span>
            チェックイン30日前〜8日前まで：宿泊料金（食事・オプション含む）の50％
          </li>
          <li className="text-gray-700 relative pl-6">
            <span className="absolute left-0 top-0 text-gray-500">●</span>
            チェックイン7日前以降：宿泊料金（食事・オプション含む）の100％
          </li>
        </ul>

        {/* 注意書き */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <span className="font-bold">ご注意：</span>
            クレジットカード決済を選択された場合、チェックイン31日前までのキャンセルであっても、
            クレジットカード決済手数料として予約総額の3.6%のキャンセル料が発生いたします。
          </p>
        </div>
      </div>

      {/* お支払い方法 */}
      <div className={`mb-8 ${isMobile ? "px-4" : ""}`}>
        <h3 className="bg-gray-800 text-white py-3 text-center text-lg font-bold rounded-md mb-4">
          お支払い方法
        </h3>

        {/* クーポンコード */}
        <div className="mb-6 border-2 border-gray-300 rounded-md p-4">
          <h4 className="font-medium text-gray-600 mb-2">クーポンコード</h4>
          <div className="flex flex-col sm:flex-row">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="クーポンコードを入力"
              className="flex-grow border rounded-t-md sm:rounded-l-md sm:rounded-t-none px-3 py-2 mb-2 sm:mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={applyCoupon}
              className="bg-blue-500 text-white px-4 py-2 rounded-b-md sm:rounded-r-md sm:rounded-b-none hover:bg-blue-600 transition duration-300"
            >
              適用
            </button>
          </div>
          {appliedCoupon && (
            <div className="mt-2 text-sm text-green-600">
              クーポンが適用されました。割引額: ¥{discountAmount.toLocaleString()}
            </div>
          )}
        </div>

        {/* クレジットカード決済 */}
        <div
          className={`border-2 ${
            paymentMethod === "credit"
              ? "border-blue-500 bg-blue-50 shadow-md"
              : "border-gray-300"
          } rounded-md p-4 mb-4 cursor-pointer transition-all duration-300`}
          onClick={() => setPaymentMethod("credit")}
        >
          <div className="flex items-center">
            <input
              type="radio"
              id="credit"
              name="payment"
              value="credit"
              checked={paymentMethod === "credit"}
              onChange={() => setPaymentMethod("credit")}
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

          {/* クレジットカード決済フォームの表示 */}
          {paymentMethod === "credit" && clientSecret && (
            <div className="mt-4">
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
                  roomTotal={roomTotal}
                  mealTotal={mealTotal}
                  validatePersonalInfo={validatePersonalInfo}
                />
              </Elements>
            </div>
          )}
        </div>

        {/* 現地決済 */}
        <div
          className={`border-2 ${
            paymentMethod === "onsite"
              ? "border-blue-500 bg-blue-50 shadow-md"
              : "border-gray-300"
          } rounded-md p-4 mb-4 cursor-pointer transition-all duration-300`}
          onClick={() => setPaymentMethod("onsite")}
        >
          <div className="flex items-center">
            <input
              type="radio"
              id="onsite"
              name="payment"
              value="onsite"
              checked={paymentMethod === "onsite"}
              onChange={() => setPaymentMethod("onsite")}
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

      {/* 現地決済の「予約を確定する」ボタン */}
      {paymentMethod === "onsite" && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={handleOnsitePayment}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition duration-300"
          >
            {loading ? "処理中..." : "予約を確定する"}
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
  roomTotal: number;
  mealTotal: number;
  validatePersonalInfo: () => boolean;
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
  roomTotal,
  mealTotal,
  validatePersonalInfo,
}: CreditCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { state } = useReservation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // バリデーションを実行
    if (!validatePersonalInfo()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setLoading(false);
      return;
    }

    if (!personalInfo) {
      alert("個人情報を入力してください。");
      return;
    }

    if (!stripe || !elements) {
      alert("Stripeの初期化が完了していません。");
      return;
    }

    setLoading(true);

    // メールアドレスの確認
    if (personalInfo.email !== personalInfo.emailConfirm) {
      alert("メールアドレスが一致しません。");
      setLoading(false);
      return;
    }

    // 生年月日の作成と検証
    const birthDateString = `${personalInfo.birthYear}-${personalInfo.birthMonth}-${personalInfo.birthDay}`;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) {
      alert("生年月日が無効です。");
      setLoading(false);
      return;
    }

    // チェックイン日の検証
    if (!state.selectedDate) {
      alert("チェックイン日が選択されていません。");
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
      const guestsWithMeals = Object.values(
        state.selectedFoodPlansByUnit || {}
      ).reduce((sum, unitPlans) => {
        return (
          sum +
          Object.values(unitPlans).reduce((unitSum, datePlans) => {
            return (
              unitSum +
              Object.values(datePlans).reduce(
                (dateSum, plan) => dateSum + plan.count,
                0
              )
            );
          }, 0)
        );
      }, 0);

      // 部屋代の日ごとの内訳を計算
      const roomRates = state.dailyRates.map((day) => ({
        date: formatDateLocal(day.date),
        price: day.price * state.units,
      }));

      // roomTotalは従来通り計算
      const roomTotal = roomRates.reduce((total, day) => total + day.price, 0);

      // guest_counts の作成
      const guest_counts: GuestCounts = {};

      for (let unitIndex = 0; unitIndex < state.units; unitIndex++) {
        const unitId = `unit_${unitIndex + 1}`;
        guest_counts[unitId] = {};
        const guestCount = state.guestCounts[unitIndex];
        for (let i = 0; i < state.nights; i++) {
          const date = new Date(state.selectedDate!);
          date.setDate(date.getDate() + i);
          const dateStr = formatDateLocal(date);
          guest_counts[unitId][dateStr] = {
            num_male: guestCount.male,
            num_female: guestCount.female,
            num_child_with_bed: guestCount.childWithBed,
            num_child_no_bed: guestCount.childNoBed,
          };
        }
      }

      // meal_plans の作成
      const meal_plans: MealPlans = {};

      for (const [unitIndex, unitPlans] of Object.entries(
        state.selectedFoodPlansByUnit || {}
      )) {
        const unitId = `unit_${parseInt(unitIndex) + 1}`;
        meal_plans[unitId] = unitPlans;
      }

      // 「special_requests」の値を設定
      let specialRequestsValue = "";

      if (personalInfo.purposeDetails) {
        specialRequestsValue += personalInfo.purposeDetails + "\n";
      }

      if (personalInfo.notes) {
        specialRequestsValue += personalInfo.notes;
      }

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
        past_stay: personalInfo.pastStay === "repeat",
        check_in_date: formatDateLocal(state.selectedDate),
        num_nights: state.nights,
        num_units: state.units,
        guest_counts,
        estimated_check_in_time: personalInfo.checkInTime,
        purpose: personalInfo.purpose,
        special_requests: specialRequestsValue,
        transportation_method: personalInfo.transportation,
        room_rate: roomTotal,
        room_rates: roomRates,
        meal_plans,
        total_guests: totalGuests,
        guests_with_meals: guestsWithMeals,
        total_meal_price: mealTotal,
        total_amount: totalAmountBeforeDiscount,
        payment_amount: totalAmountAfterDiscount,
        reservation_status: "pending",
        payment_method: "credit",
        payment_status: "pending",
        stripe_payment_intent_id: paymentIntentId,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        affiliate_id: appliedCoupon ? appliedCoupon.affiliateId : null,
      };

      // Supabaseに予約情報を保存
      const { data: reservationResult, error } = await supabase
        .from("reservations")
        .insert([reservationData])
        .select();

      if (error) {
        throw error;
      }

      if (!reservationResult || reservationResult.length === 0) {
        throw new Error("予約の保存に失敗しました");
      }

      const reservationId = reservationResult[0].id;

      // FastAPIにデータを送信
      await sendReservationData(reservationData);

      // メール送信APIにリクエストを送信
      await fetch("/api/send-reservation-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestEmail: personalInfo.email,
          guestName: `${personalInfo.lastName} ${personalInfo.firstName}`,
          adminEmail: "info@nest-biwako.com",
          planName: "【一棟貸切】贅沢選びつくしヴィラプラン",
          roomName: "", // 必要に応じて設定
          checkInDate: formatDateLocal(state.selectedDate),
          nights: state.nights,
          units: state.units,
          guestCounts: guest_counts,
          guestInfo: JSON.stringify({
            email: personalInfo.email,
            phone: personalInfo.phone,
          }),
          paymentMethod: "クレジットカード",
          totalAmount: totalAmountAfterDiscount.toLocaleString(),
          specialRequests: specialRequestsValue || "",
          reservationNumber: reservationNumber,
          mealPlans: meal_plans,
          purpose: personalInfo.purpose,
        }),
      });

      // 5000円引きクーポンを使用済みに更新
      if (appliedCoupon && appliedCoupon.discountAmount === 5000) {
        const { error: couponError } = await supabase
          .from("coupons")
          .update({ is_used: true })
          .eq("id", appliedCoupon.id);

        if (couponError) {
          console.error("Error updating coupon status:", couponError);
        }
      }

      // 決済処理
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/reservation-complete?reservationId=${reservationId}`,
        },
      });

      if (result.error) {
        console.error("Payment error:", result.error);
        alert("お支払いに失敗しました。もう一度お試しください。");

        // 予約ステータスをキャンセルに更新
        await supabase
          .from("reservations")
          .update({ reservation_status: "cancelled", payment_status: "failed" })
          .eq("id", reservationId);

        setLoading(false);
        return;
      }

      // 決済成功時の処理は return_url で行われます
    } catch (err: any) {
      console.error("Error during reservation or payment:", err);
      alert("予約またはお支払いに失敗しました。もう一度お試しください。");
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "4px",
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
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          type="submit"
          disabled={loading || !stripe || !elements}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition duration-300"
        >
          {loading ? "処理中..." : "予約を確定する"}
        </button>
      </div>
    </form>
  );
}
