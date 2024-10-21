"use client"
import React, { useEffect, useMemo, useCallback } from 'react';
import { FoodPlan } from '@/app/types/food-plan';
import { useReservation, SelectedFoodPlan, SelectedFoodPlanByDate } from '@/app/contexts/ReservationContext';
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

  const totalGuests = useMemo(() => {
    return guestSelectionData?.guestCounts.reduce(
      (acc, count) =>
        acc + count.male + count.female + count.childWithBed + count.childNoBed,
      0
    ) ?? 0;
  }, [guestSelectionData]);

  const mealGuests = useMemo(() => {
    return Object.values(selectedPlansByDate).reduce(
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
  }, [selectedPlansByDate]);

  const noMealGuests = useMemo(() => totalGuests - mealGuests, [totalGuests, mealGuests]);

  const nights = useMemo(() => guestSelectionData?.nights || state.nights || 1, [guestSelectionData, state.nights]);
  const units = useMemo(() => guestSelectionData?.units || state.units || 1, [guestSelectionData, state.units]);

  const roomPrice = useMemo(() => {
    return state.dailyRates.reduce((sum: number, dailyRate) => {
      return sum + dailyRate.price * units;
    }, 0);
  }, [state.dailyRates, units]);

  const totalMealPrice = useMemo(() => {
    return Object.values(selectedPlansByDate).reduce(
      (sum: number, plansForDate) => {
        return (
          sum +
          Object.values(plansForDate).reduce((innerSum: number, plan) => {
            return innerSum + plan.price;
          }, 0)
        );
      },
      0
    );
  }, [selectedPlansByDate]);

  const totalAmount = useMemo(() => roomPrice + totalMealPrice, [roomPrice, totalMealPrice]);

  useEffect(() => {
    dispatch({ type: 'SET_TOTAL_PRICE', payload: totalAmount });
    dispatch({ type: 'SET_TOTAL_MEAL_PRICE', payload: totalMealPrice });
  }, [dispatch, totalAmount, totalMealPrice]);

  const formatDate = useCallback((date: Date): string => {
    return format(date, "yyyy年MM月dd日（E）", { locale: ja });
  }, []);
  
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
              {`${formatDate(dailyRate.date)}: ${units}棟`}
            </span>
            <span>
              {dailyRate.price.toLocaleString()}円 × {units}棟 = {' '}
              {(dailyRate.price * units).toLocaleString()}円
            </span>
          </div>
        ))}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 font-bold">
          <span className="mb-1 sm:mb-0">宿泊料金合計</span>
          <span>{roomPrice.toLocaleString()}円</span>
        </div>
      </div>

      <div className="bg-[#363331] text-white p-3 rounded-t-lg">
        <h3 className="text-base sm:text-lg font-semibold">選択された食事プラン</h3>
      </div>
      <div className="bg-white p-4 rounded-b-lg mb-4 sm:mb-6 text-[#363331]">
        {Object.entries(selectedPlansByDate).map(
          ([date, plansForDate], dateIndex) => (
            <div key={dateIndex} className="mb-4 last:mb-0">
              <h4 className="font-semibold mb-2">
                {formatDate(new Date(date))}
              </h4>
              {Object.entries(plansForDate).map(
                ([planId, planInfo], planIndex) => {
                  const plan = foodPlans.find((p) => p.id === planId);
                  if (plan && planInfo.count > 0) {
                    return (
                      <div key={planIndex} className="mb-2 last:mb-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <span className="mb-1 sm:mb-0">{plan.name}</span>
                          <span>
                            {planInfo.count}名 × {' '}
                            {plan.price.toLocaleString()}円 = {' '}
                            {(planInfo.count * plan.price).toLocaleString()}円
                          </span>
                        </div>
                        {planInfo.menuSelections && Object.keys(planInfo.menuSelections).length > 0 && (
                          <div className="ml-4 mt-2">
                            <strong>詳細:</strong>
                            <ul className="list-disc list-inside">
                              {Object.entries(planInfo.menuSelections).map(([category, items]) => (
                                <li key={category}>
                                  {category}:
                                  {Object.entries(items).map(([item, count]) => (
                                    <span key={item}> {item}({count}名)</span>
                                  ))}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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
        <div className="space-y-4">
          {amenities.map((item) => (
            <div key={item.label} className="bg-[#E6E6E6] rounded-lg p-3">
              <span className="font-semibold text-[#363331] block mb-2">{item.label}</span>
              <div className="flex flex-wrap gap-2">
                {item.content.split('、').map((content, index) => (
                  <span key={index} className="bg-white text-[#363331] px-2 py-1 rounded-full text-sm">
                    {content}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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