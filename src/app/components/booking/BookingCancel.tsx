'use client';

import { useState, useEffect } from 'react';
import CustomButton from '@/app/components/ui/CustomButton';
import CustomCard, { CustomCardContent } from '@/app/components/ui/CustomCard';
import { Reservation } from '@/app/types/supabase';
import React from 'react'; // {{ edit_1 }}

export default function BookingCancel() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [cancellationFee, setCancellationFee] = useState<number | null>(null);

  useEffect(() => {
    fetchReservation();
  }, []);

  const fetchReservation = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const response = await fetch('/api/reservations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reservation');
      }

      const data = await response.json();
      setReservation(data);

      // キャンセル料の計算
      calculateCancellationFee(data);
    } catch (error) {
      setError('予約情報の取得に失敗しました。');
      console.error('Error fetching reservation:', error);
    }
  };

  const calculateCancellationFee = (reservationData: Reservation) => {
    const checkInDate = new Date(reservationData.check_in_date);
    const today = new Date();
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let fee = 0;
    if (diffDays <= 7) {
      fee = reservationData.payment_amount || reservationData.total_amount;
    } else if (diffDays <= 30) {
      fee = ((reservationData.payment_amount || reservationData.total_amount) * 0.5);
    } else {
      fee = 0;
    }

    setCancellationFee(fee);
  };

  const handleCancelReservation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const response = await fetch('/api/cancel-reservation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel reservation');
      }

      setIsCancelled(true);
      console.log('予約をキャンセルしました');
    } catch (error) {
      setError('予約のキャンセルに失敗しました。');
      console.error('Error cancelling reservation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!reservation) {
    return <div>Loading...</div>;
  }

  return (
    <CustomCard>
      <CustomCardContent>
        <div className="space-y-5 text-[#363331]">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">＜予約をキャンセルできます＞</h2>
            <p className="text-red-500">まだ予約のキャンセルは成立しておりません</p>
          </div>

          <Section title="キャンセル料">
            <p className="text-center font-bold">
              キャンセル料: {cancellationFee?.toLocaleString()}円
            </p>
          </Section>

          <Section title="キャンセル時の注意項目（キャンセルポリシー）">
            <ul className="list-disc pl-5">
              <li>宿泊日から30日前〜　宿泊料金（食事・オプション含む）の５０％</li>
              <li>宿泊日から7日前〜　宿泊料金（食事・オプション含む）の１００％</li>
              {reservation.payment_method === 'credit' && (
                <li className="text-red-500 font-semibold">
                  クレジットカード決済の場合、宿泊日の30日前よりも前のキャンセルでも、
                  予約総額の3.6%のキャンセル手数料が発生します。
                </li>
              )}
            </ul>
          </Section>

          <Section title="予約情報">
            <div className="grid grid-cols-2 gap-4">
              <SubSection title="予約番号" content={reservation.reservation_number} />
              <SubSection title="予約受付日時" content={new Date(reservation.created_at).toLocaleString('ja-JP')} />
              <SubSection
                title="お支払い方法"
                content={reservation.payment_method === 'credit' ? 'クレジットカード' : '現地決済'}
              />
            </div>
            {reservation.payment_method === 'credit' && (
              <p className="mt-4 text-sm text-red-500">
                ※クレジットカード決済を選択されているため、30日前よりも前のキャンセルでも
                3.6%のキャンセル手数料が発生する可能性があります。
              </p>
            )}
          </Section>

          <Section title="プラン情報">
            <div className="grid grid-cols-2 gap-4">
              <SubSection title="プラン" content="【一棟貸切】贅沢選びつくしヴィラプラン" />
              <SubSection title="宿泊日" content={new Date(reservation.check_in_date).toLocaleDateString('ja-JP')} />
              <SubSection title="棟数" content={`${reservation.num_units}棟`} />
            </div>
          </Section>

          <Section title="お見積もり内容">
            <EstimateTable reservation={reservation} />
          </Section>

          <div className="text-center">
            {isCancelled ? (
              <p className="text-green-500 font-bold">予約がキャンセルされました。</p>
            ) : (
              <>
                <CustomButton
                  onClick={handleCancelReservation}
                  disabled={isLoading}
                  className="bg-blue-500 text-white px-10 py-3 rounded-full text-lg font-bold hover:bg-blue-600 transition-colors"
                >
                  {isLoading ? 'キャンセル中...' : '予約をキャンセルする'}
                </CustomButton>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                <p className="text-red-500 mt-2">※キャンセルの取り消しはできません。</p>
                {reservation.payment_method === 'credit' && (
                  <p className="text-red-500 mt-2 text-sm">
                    ※クレジットカード決済を選択されているため、30日前よりも前のキャンセルでも
                    3.6%のキャンセル手数料が発生する可能性があります。
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </CustomCardContent>
    </CustomCard>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="bg-[#333333] text-white p-2 text-lg font-bold text-center">{title}</h3>
      <div className="bg-white p-4">{children}</div>
    </div>
  );
}

function SubSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="flex items-center">
      <div className="bg-gray-200 p-2 w-1/3 text-center rounded">{title}</div>
      <div className="ml-4 w-2/3">{content}</div>
    </div>
  );
}

function EstimateTable({ reservation }: { reservation: Reservation }) {
  const mealPlanNames = {
    'plan-a': 'Plan A 贅沢素材のディナーセット',
    'plan-b': 'Plan B お肉づくし！豪華BBQセット',
    'plan-c': '大満足！よくばりお子さまセット'
  };

  const renderMealPlanDetails = (planId: string, planDetails: any) => {
    if (!planDetails.menuSelections) {
      return null;
    }

    return Object.entries(planDetails.menuSelections).map(([category, selections]: [string, any], index) => (
      <div key={index} className="ml-4 text-sm">
        <strong>{category}:</strong>
        <ul className="list-disc ml-4">
          {Object.entries(selections).map(([item, count]: [string, any], itemIndex) => (
            typeof count === 'number' && count > 0 && (
              <li key={itemIndex}>{item}: {count}</li>
            )
          ))}
        </ul>
      </div>
    ));
  };

  // クーポン割引額の計算
  const discountAmount = reservation.total_amount - (reservation.payment_amount || reservation.total_amount);

  return (
    <div className="space-y-4">
      {/* 宿泊料金 */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">プラン</th>
            <th className="text-left p-2 border">数量</th>
            <th className="text-right p-2 border">金額</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3} className="font-bold p-2 border bg-gray-50">
              &lt;宿泊料金&gt;
            </td>
          </tr>
          <tr>
            <td className="p-2 border">ヴィラ料金</td>
            <td className="p-2 border">{reservation.num_units}棟</td>
            <td className="text-right p-2 border">{reservation.room_rate.toLocaleString()}円</td>
          </tr>
        </tbody>
      </table>

      {/* 食事プラン */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">プラン</th>
            <th className="text-left p-2 border">数量</th>
            <th className="text-right p-2 border">金額</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3} className="font-bold p-2 border bg-gray-50">
              &lt;食事プラン&gt;
            </td>
          </tr>
          {reservation.meal_plans && Object.keys(reservation.meal_plans).length > 0 ? (
            Object.entries(reservation.meal_plans).map(([date, plans]: [string, any], index) => (
              <React.Fragment key={index}>
                <tr>
                  <td colSpan={3} className="p-2 border bg-gray-200">
                    {new Date(date).toLocaleDateString('ja-JP')}
                  </td>
                </tr>
                {Object.entries(plans).map(([planId, planDetails]: [string, any], idx) => (
                  <tr key={`${index}-${idx}`}>
                    <td className="p-2 border">
                      {mealPlanNames[planId as keyof typeof mealPlanNames] || planId}
                      {renderMealPlanDetails(planId, planDetails)}
                    </td>
                    <td className="p-2 border">{planDetails.count}</td>
                    <td className="text-right p-2 border">{planDetails.price.toLocaleString()}円</td>
                  </tr>
                ))}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="p-2 border text-center">食事プランなし</td>
            </tr>
          )}
          <tr>
            <td colSpan={2} className="p-2 border font-bold">食事プラン合計</td>
            <td className="text-right p-2 border font-bold">{reservation.total_meal_price.toLocaleString()}円</td>
          </tr>
        </tbody>
      </table>

      {/* 割引と合計金額 */}
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td colSpan={2} className="p-2 border">消費税</td>
            <td className="text-right p-2 border">込み</td>
          </tr>
          <tr>
            <td colSpan={2} className="p-2 border">サービス料</td>
            <td className="text-right p-2 border">込み</td>
          </tr>
          {reservation.coupon_code && discountAmount > 0 && (
            <tr>
              <td colSpan={2} className="p-2 border">クーポン割引 ({reservation.coupon_code})</td>
              <td className="text-right p-2 border">- {discountAmount.toLocaleString()}円</td>
            </tr>
          )}
          <tr className="font-bold text-lg bg-gray-100">
            <td colSpan={2} className="p-2 border">合計金額</td>
            <td className="text-right p-2 border">
              {reservation.payment_amount
                ? `${reservation.payment_amount.toLocaleString()}円`
                : `${reservation.total_amount.toLocaleString()}円`}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 宿泊人数の内訳 */}
      <div className="text-sm">
        <p>宿泊人数: {reservation.total_guests}名</p>
        <p>内訳:</p>
        <ul className="list-disc ml-4">
          <li>大人 (男性): {reservation.num_male}名</li>
          <li>大人 (女性): {reservation.num_female}名</li>
          <li>子供 (ベッドあり): {reservation.num_child_with_bed}名</li>
          <li>子供 (添い寝): {reservation.num_child_no_bed}名</li>
        </ul>
      </div>
    </div>
  );
}
