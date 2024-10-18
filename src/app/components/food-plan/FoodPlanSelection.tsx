'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FoodPlan } from '@/app/types/food-plan';
import FoodPlanCard from './FoodPlanCard';
import { useReservation, SelectedFoodPlanByDate } from '@/app/contexts/ReservationContext';
import { useRouter } from 'next/navigation';

interface FoodPlanSelectionProps {
  foodPlans: FoodPlan[];
  initialTotalGuests: number;
  checkInDate: string;
  nights: number;
  dates: string[];
}

export default function FoodPlanSelection({
  foodPlans,
  initialTotalGuests,
  checkInDate,
  nights,
  dates
}: FoodPlanSelectionProps) {
  const router = useRouter();
  const { state, dispatch } = useReservation();
  const [currentDate, setCurrentDate] = useState<string>(dates[0] || '');
  const [selectedPlans, setSelectedPlans] = useState<SelectedFoodPlanByDate>({});
  const [menuSelections, setMenuSelections] = useState<{ [date: string]: { [planId: string]: { [category: string]: { [item: string]: number } } } }>({});
  const [hasMeal, setHasMeal] = useState<'yes' | 'no'>('no');
  const [mealGuestCount, setMealGuestCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dates.length > 0) {
      setCurrentDate(dates[0]);
    }
  }, [dates]);

  useEffect(() => {
    const totalMealPrice = calculateTotalPrice();

    const formattedPlans: { [planId: string]: { count: number; menuSelections?: any } } = {};
    Object.entries(selectedPlans).forEach(([date, datePlans]) => {
      Object.entries(datePlans).forEach(([planId, planInfo]) => {
        if (!formattedPlans[planId]) {
          formattedPlans[planId] = { count: 0, menuSelections: {} };
        }
        formattedPlans[planId].count += planInfo.count;
      });
    });

    dispatch({ type: 'SET_FOOD_PLANS', payload: formattedPlans });
    dispatch({ type: 'SET_FOOD_PLANS_BY_DATE', payload: selectedPlans });
    const accommodationPrice = state.totalPrice - state.totalMealPrice;
    const totalPrice = accommodationPrice + totalMealPrice;
    dispatch({ type: 'SET_TOTAL_PRICE', payload: totalPrice });
  }, [selectedPlans, menuSelections, dispatch, state.totalPrice, state.totalMealPrice]);

  const handleDateChange = (date: string) => {
    setCurrentDate(date);
  };

  const handleMealOptionChange = (value: 'yes' | 'no') => {
    setHasMeal(value);
    if (value === 'no') {
      setMealGuestCount(0);
      setSelectedPlans({});
      setMenuSelections({});
    } else {
      setMealGuestCount(initialTotalGuests);
    }
  };

  const handleMealGuestCountChange = (change: number) => {
    setMealGuestCount(prev => {
      const newCount = Math.max(0, Math.min(prev + change, initialTotalGuests));
      if (newCount < prev) {
        setSelectedPlans({});
        setMenuSelections({});
      }
      return newCount;
    });
  };

  // 修正した handleCountChange 関数
  const handleCountChange = useCallback((planId: string, change: number) => {
    console.log(`Changing count for plan ${planId} by ${change}`);
    setSelectedPlans(prev => {
      const newPlans = { ...prev };
      if (!newPlans[currentDate]) {
        newPlans[currentDate] = {};
      }
      if (!newPlans[currentDate][planId]) {
        newPlans[currentDate][planId] = { count: 0, price: 0 };
      }
      const currentCount = newPlans[currentDate][planId].count;
      const newCount = Math.max(0, currentCount + change);
  
      const plan = foodPlans.find(p => p.id === planId);
      const price = plan ? plan.price : 0;
  
      if (newCount === 0) {
        delete newPlans[currentDate][planId];
      } else {
        newPlans[currentDate][planId] = {
          count: newCount,
          price: price * newCount,
          menuSelections: newPlans[currentDate][planId].menuSelections
        };
      }
  
      const totalSelected = Object.values(newPlans[currentDate]).reduce((sum, planInfo) => sum + planInfo.count, 0);
      console.log(`Total selected for ${currentDate}: ${totalSelected}`);
      if (totalSelected > mealGuestCount) {
        newPlans[currentDate][planId].count = Math.max(0, newCount - (totalSelected - mealGuestCount));
        newPlans[currentDate][planId].price = price * newPlans[currentDate][planId].count;
      }
      console.log('Updated selectedPlans:', newPlans);
      return newPlans;
    });
  }, [currentDate, mealGuestCount, foodPlans]);

  const handleMenuSelection = (planId: string, category: string, item: string, count: number) => {
    setMenuSelections(prev => {
      const newSelections = { ...prev };
      if (!newSelections[currentDate]) {
        newSelections[currentDate] = {};
      }
      if (!newSelections[currentDate][planId]) {
        newSelections[currentDate][planId] = {};
      }
      if (!newSelections[currentDate][planId][category]) {
        newSelections[currentDate][planId][category] = {};
      }

      if (count === 0) {
        delete newSelections[currentDate][planId][category][item];
      } else {
        newSelections[currentDate][planId][category][item] = count;
      }

      return newSelections;
    });
  };

  const calculateTotalPrice = () => {
    return Object.entries(selectedPlans).reduce((sum, [date, plans]) => {
      return sum + Object.values(plans).reduce((dateSum, planInfo) => {
        return dateSum + planInfo.price;
      }, 0);
    }, 0);
  };
  
  const calculateSubtotalForDate = (date: string) => {
    const plans = selectedPlans[date] || {};
    return Object.values(plans).reduce((sum, planInfo) => sum + planInfo.price, 0);
  };
  

  const remainingNoMealGuests = mealGuestCount - Object.values(selectedPlans[currentDate] || {}).reduce((sum, planInfo) => sum + planInfo.count, 0);

  return (
    <div className="text-[#363331]">
      <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
        {/* 食事あり・なしの選択ボタン */}
        <div className="flex justify-center space-x-4 mb-6">
          {['yes', 'no'].map((option) => (
            <button
              key={option}
              onClick={() => handleMealOptionChange(option as 'yes' | 'no')}
              className={`px-6 py-3 rounded-full text-lg font-semibold transition-colors duration-200 ${
                hasMeal === option
                  ? 'bg-[#00A2EF] text-white'
                  : 'bg-white text-[#00A2EF] border-2 border-[#00A2EF]'
              }`}
            >
              食事{option === 'yes' ? 'あり' : 'なし'}
            </button>
          ))}
        </div>

        {hasMeal === 'yes' && (
          <>
            {/* 食事が必要な人数の選択 */}
            <div className="mt-6">
              <p className="text-lg font-semibold mb-3 text-center">食事が必要な人数: {mealGuestCount}名</p>
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={() => handleMealGuestCountChange(-1)}
                  className="w-10 h-10 rounded-full bg-[#00A2EF] text-white flex items-center justify-center text-2xl font-bold"
                >
                  -
                </button>
                <span className="text-2xl font-bold">{mealGuestCount}</span>
                <button
                  onClick={() => handleMealGuestCountChange(1)}
                  className="w-10 h-10 rounded-full bg-[#00A2EF] text-white flex items-center justify-center text-2xl font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* 新しく追加する説明文 */}
            <div className="mt-6 p-4 bg-blue-100 rounded-lg">
              <h2 className="text-xl font-bold mb-2 text-center">食事プランをご選択ください</h2>
              <p className="text-center mb-2">1名様ずつお好きなプランをご注文いただけます。</p>
              <p className="text-center">
                例）{mealGuestCount}名様でご利用の場合、plan.Aを2名・plan.Bを1名にし、残りを食事なしにすることも可能です。
              </p>
            </div>

            {/* 日付選択（連泊の場合） */}
            {nights > 1 && (
              <div className="mt-6">
                <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-2">編集中の日付:</label>
                <select
                  id="date-select"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  onChange={(e) => handleDateChange(e.target.value)}
                  value={currentDate}
                >
                  {dates.map((date, index) => (
                    <option key={date} value={date}>
                      {index + 1}日目 ({date})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {hasMeal === 'yes' && mealGuestCount > 0 && (
        <>
          {/* 食事プランの選択 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {foodPlans.filter(plan => plan.id !== 'no-meal').map((plan) => {
              const currentCount = selectedPlans[currentDate]?.[plan.id]?.count || 0;
              const totalSelected = Object.values(selectedPlans[currentDate] || {}).reduce((sum, planInfo) => sum + planInfo.count, 0);
              const remaining = mealGuestCount - (totalSelected - currentCount);

              return (
                <FoodPlanCard
                  key={plan.id}
                  plan={plan}
                  count={selectedPlans[currentDate]?.[plan.id]?.count || 0}
                  onCountChange={(change) => handleCountChange(plan.id, change)}
                  menuSelections={menuSelections[currentDate]?.[plan.id]}
                  onMenuSelection={(category, item, count) => handleMenuSelection(plan.id, category, item, count)}
                  totalPrice={selectedPlans[currentDate]?.[plan.id]?.price || 0}
                  totalGuests={mealGuestCount}
                  max={remaining}
                />
              );
            })}
          </div>

          {/* 小計表示 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-[#363331]">この日の小計</span>
              <span className="text-2xl font-bold text-[#00A2EF]">
                {calculateSubtotalForDate(currentDate).toLocaleString()}円
              </span>
            </div>

            {remainingNoMealGuests > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                ※ 食事なしの人数: {remainingNoMealGuests}名
              </p>
            )}
          </div>

          {/* 合計金額表示 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-[#363331]">食事プラン合計金額</span>
              <span className="text-2xl font-bold text-[#00A2EF]">
                {calculateTotalPrice().toLocaleString()}円
              </span>
            </div>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}
        </>
      )}

      {/* 食事プラン選択サマリー */}
      <FoodPlanSummary
        selectedPlans={selectedPlans}
        foodPlans={foodPlans}
        dates={dates}
      />
    </div>
  );
}

interface FoodPlanSummaryProps {
  selectedPlans: SelectedFoodPlanByDate;
  foodPlans: FoodPlan[];
  dates: string[];
}

const FoodPlanSummary: React.FC<FoodPlanSummaryProps> = ({ selectedPlans, foodPlans, dates }) => {
  return (
    <div className="mt-8 bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">食事プラン選択サマリー</h3>
      {dates.map((date, index) => {
        const planForDate = selectedPlans[date] || {};
        return (
          <div key={date} className="mb-2">
            <p className="font-medium">{index + 1}日目 ({date}):</p>
            {Object.entries(planForDate).map(([planId, planInfo]) => {
              const plan = foodPlans.find(p => p.id === planId);
              return plan && planInfo.count > 0 ? (
                <p key={planId} className="ml-4">
                  {plan.name}: {planInfo.count}名
                </p>
              ) : null;
            })}
            {Object.keys(planForDate).length === 0 && (
              <p className="ml-4 text-gray-500">選択されていません</p>
            )}
          </div>
        );
      })}
    </div>
  );
};