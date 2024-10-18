// src/app/components/reservation/ReservationConfirmation.tsx
'use client';

import React, { useEffect } from 'react';
import { FoodPlan } from '@/app/types/food-plan';
import {
  useReservation,
  SelectedFoodPlan,
  SelectedFoodPlanByDate,
} from '@/app/contexts/ReservationContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface GuestCounts {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

interface GuestSelectionData {
  guestCounts: GuestCounts[];
  totalPrice: number;
  units: number;
  nights: number;
}

interface ReservationConfirmationProps {
  selectedPlansByDate: SelectedFoodPlanByDate;
  selectedPlans: {
    [planId: string]: SelectedFoodPlan;
  };
  totalPrice: number;
  guestSelectionData?: GuestSelectionData;
  foodPlans: FoodPlan[];
  amenities: { label: string; content: string }[];
  onPersonalInfoClick: () => void;
}

const ReservationConfirmation: React.FC<ReservationConfirmationProps> = ({
  selectedPlansByDate,
  selectedPlans,
  totalPrice,
  guestSelectionData,
  foodPlans,
  amenities,
  onPersonalInfoClick,
}) => {
  const { state, dispatch } = useReservation();

  const totalGuests =
    guestSelectionData?.guestCounts.reduce(
      (acc, count) =>
        acc + count.male + count.female + count.childWithBed + count.childNoBed,
      0
    ) ?? 0;

  // 食事が必要な人数を計算
  const mealGuests = Object.values(selectedPlansByDate).reduce(
    (sum: number, plansForDate) => {
      return (
        sum +
        Object.values(plansForDate).reduce((innerSum: number, plan) => {
          return innerSum + plan.count;
        }, 0)
      );
    },
    0
  );

  const noMealGuests = totalGuests - mealGuests;

  // 泊数と棟数を取得
  const nights = guestSelectionData?.nights || state.nights || 1;
  const units = guestSelectionData?.units || state.units || 1;

  // 部屋代を計算 (各日の価格 × 棟数)
  const roomPrice = state.dailyRates.reduce((sum: number, dailyRate) => {
    return sum + dailyRate.price * units;
  }, 0);

  // 食事代を計算
  const totalMealPrice = Object.values(selectedPlansByDate).reduce(
    (sum: number, plansForDate) => {
      return (
        sum +
        Object.values(plansForDate).reduce((innerSum: number, plan) => {
          return innerSum + plan.price * plan.count;
        }, 0)
      );
    },
    0
  );

  // 合計金額を計算
  const totalAmount = roomPrice + totalMealPrice;

  // state.totalPrice と state.totalMealPrice を更新
  useEffect(() => {
    dispatch({ type: 'SET_TOTAL_PRICE', payload: totalAmount });
    dispatch({ type: 'SET_TOTAL_MEAL_PRICE', payload: totalMealPrice });
  }, [dispatch, totalAmount, totalMealPrice]);

  // 日付をフォーマットする関数
  const formatDate = (date: Date): string => {
    return format(date, "yyyy'年'MM'月'dd'日'（E）", { locale: ja });
  };

  return (
    <div className="bg-[#F7F7F7] p-4 sm:p-6 rounded-lg">
      <h2 className="bg-[#363331] text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-white p-3 rounded-lg">
        予約内容の確認
      </h2>

      <div className="bg-white rounded-lg p-4 mb-4 sm:mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <span className="text-base sm:text-lg font-semibold text-[#363331] mb-2 sm:mb-0">
            合計金額
          </span>
          <div className="text-center sm:text-right">
            <span className="text-3xl sm:text-4xl font-bold text-[#00A2EF]">
              {totalAmount.toLocaleString()}
            </span>
            <span className="text-lg sm:text-xl text-[#363331]">円</span>
            <span className="block sm:inline text-sm text-gray-500 mt-1 sm:mt-0 sm:ml-2">
              (一人あたり 約
              {totalGuests > 0
                ? Math.round(totalAmount / totalGuests).toLocaleString()
                : 0}
              円)
            </span>
          </div>
        </div>
      </div>

      {/* 部屋代の表示を修正 */}
      <div className="bg-[#363331] text-white p-3 rounded-t-lg">
        <h3 className="text-base sm:text-lg font-semibold">宿泊料金</h3>
      </div>
      <div className="bg-white p-4 rounded-b-lg mb-4 sm:mb-6 text-[#363331]">
        {state.dailyRates.map((dailyRate, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2"
          >
            <span className="mb-1 sm:mb-0">
              {`宿泊日 ${index + 1} (${formatDate(
                dailyRate.date
              )}): ${units}棟`}
            </span>
            <span>
              {dailyRate.price.toLocaleString()}円 × {units}棟 ={' '}
              {(dailyRate.price * units).toLocaleString()}円
            </span>
          </div>
        ))}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 font-bold">
          <span className="mb-1 sm:mb-0">宿泊料金合計</span>
          <span>{roomPrice.toLocaleString()}円</span>
        </div>
      </div>

      {/* 食事プランの表示 */}
      <div className="bg-[#363331] text-white p-3 rounded-t-lg">
        <h3 className="text-base sm:text-lg font-semibold">選択された食事プラン</h3>
      </div>
      <div className="bg-white p-4 rounded-b-lg mb-4 sm:mb-6 text-[#363331]">
        {Object.entries(selectedPlansByDate).map(
          ([date, plansForDate], dateIndex) => (
            <div key={dateIndex} className="mb-4">
              <h4 className="font-semibold mb-2">
                {formatDate(new Date(date))}
              </h4>
              {Object.entries(plansForDate).map(
                ([planId, planInfo], planIndex) => {
                  const plan = foodPlans.find((p) => p.id === planId);
                  if (plan && planInfo.count > 0) {
                    return (
                      <div
                        key={planIndex}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2"
                      >
                        <span className="mb-1 sm:mb-0">{plan.name}</span>
                        <span>
                          {planInfo.count}名 ×{' '}
                          {planInfo.price.toLocaleString()}円 ={' '}
                          {(
                            planInfo.count * planInfo.price
                          ).toLocaleString()}
                          円
                        </span>
                      </div>
                    );
                  }
                  return null;
                }
              )}
            </div>
          )
        )}
        {noMealGuests > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
            <span className="mb-1 sm:mb-0">食事なし</span>
            <span>{noMealGuests}名 × 0円 = 0円</span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 font-bold">
          <span className="mb-1 sm:mb-0">食事代合計</span>
          <span>{totalMealPrice.toLocaleString()}円</span>
        </div>
      </div>

      {/* 設備・備品 */}
      <div className="bg-[#363331] text-white p-3 rounded-t-lg">
        <h2 className="text-base sm:text-lg font-semibold">設備・備品</h2>
      </div>
      <div className="bg-white p-4 rounded-b-lg mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[
            { label: 'チェックイン', content: '15:00' },
            { label: 'チェックアウト', content: '11:00' },
            { label: '駐車場', content: '無料駐車場有り' },
          ].map((item) => (
            <div key={item.label} className="bg-[#E6E6E6] rounded-lg p-2">
              <span className="font-semibold text-[#363331]">{item.label}</span>
              <p className="text-[#363331]">{item.content}</p>
            </div>
          ))}
        </div>
        {amenities.map((item) => (
          <div
            key={item.label}
            className="flex flex-col sm:flex-row py-2 border-b border-gray-300 last:border-b-0"
          >
            <span className="bg-[#E6E6E6] text-[#363331] font-semibold px-3 py-1 rounded-lg w-full sm:w-32 text-center mb-2 sm:mb-0 sm:mr-4">
              {item.label}
            </span>
            <span className="flex-1 text-[#363331]">{item.content}</span>
          </div>
        ))}
      </div>

      {/* 次のステップへのボタン */}
      <div className="text-center">
        <button
          className="bg-[#00A2EF] text-white py-2 sm:py-3 px-4 sm:px-6 rounded-full text-base sm:text-lg font-semibold hover:bg-blue-600 transition duration-300"
          onClick={onPersonalInfoClick}
        >
          個人情報入力 ＞
        </button>
      </div>
    </div>
  );
};

export default ReservationConfirmation;
