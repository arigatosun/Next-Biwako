// src/app/components/food-plan/FoodPlanSelection.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FoodPlan } from '@/app/types/food-plan';
import FoodPlanCard from './FoodPlanCard';
import { useReservation } from '@/app/contexts/ReservationContext';
import { useRouter } from 'next/navigation';

interface FoodPlanSelectionProps {
  onPlanSelection: (
    plans: { [date: string]: { [planId: string]: number } },
    totalPrice: number,
    menuSelections: { [date: string]: { [planId: string]: { [category: string]: { [item: string]: number } } } }
  ) => void;
  foodPlans: FoodPlan[];
  initialTotalGuests: number;
  checkInDate: string;
  nights: number;
  dates: string[];
}

export default function FoodPlanSelection({
  onPlanSelection,
  foodPlans,
  initialTotalGuests,
  checkInDate,
  nights,
  dates
}: FoodPlanSelectionProps) {
  const router = useRouter();
  const { dispatch } = useReservation();
  const [currentDate, setCurrentDate] = useState<string>(checkInDate);
  const [selectedPlans, setSelectedPlans] = useState<{ [date: string]: { [planId: string]: number } }>({});
  const [menuSelections, setMenuSelections] = useState<{ [date: string]: { [planId: string]: { [category: string]: { [item: string]: number } } } }>({});
  const [hasMeal, setHasMeal] = useState<'yes' | 'no'>('no');
  const [mealGuestCount, setMealGuestCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const totalPrice = calculateTotalPrice();
    onPlanSelection(selectedPlans, totalPrice, menuSelections);
  }, [selectedPlans, menuSelections, onPlanSelection]);

  const handleDateChange = (date: string) => {
    setCurrentDate(date);
    console.log(`Current Date Changed: ${date}`);
  };

  const handleMealOptionChange = (value: 'yes' | 'no') => {
    setHasMeal(value);
    console.log(`Meal Option Changed: ${value}`);
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
      console.log(`Meal Guest Count Changed: ${newCount}`);
      if (newCount < prev) {
        setSelectedPlans({});
        setMenuSelections({});
      }
      return newCount;
    });
  };

  const handleCountChange = useCallback((planId: string, change: number) => {
    console.log(`Changing count for plan ${planId} by ${change}`);
    setSelectedPlans(prev => {
      const newPlans = { ...prev };
      if (!newPlans[currentDate]) {
        newPlans[currentDate] = {};
      } else {
        newPlans[currentDate] = { ...newPlans[currentDate] }; // **追加：不変性を保つためにコピー**
      }
      const currentCount = newPlans[currentDate][planId] || 0;
      const newCount = Math.max(0, currentCount + change);

      if (newCount === 0) {
        delete newPlans[currentDate][planId];
      } else {
        newPlans[currentDate][planId] = newCount;
      }

      const totalSelected = Object.values(newPlans[currentDate]).reduce((sum, count) => sum + count, 0);
      console.log(`Total selected for ${currentDate}: ${totalSelected}`);
      if (totalSelected > mealGuestCount) {
        newPlans[currentDate][planId] = Math.max(0, newCount - (totalSelected - mealGuestCount));
        console.log(`Adjusted count for plan ${planId} to prevent exceeding guest count: ${newPlans[currentDate][planId]}`);
      }
      console.log('Updated selectedPlans:', newPlans);
      return newPlans;
    });
  }, [currentDate, mealGuestCount]);

  const handleMenuSelection = (planId: string, category: string, item: string, count: number) => {
    console.log(`Menu Selection - Plan ID: ${planId}, Category: ${category}, Item: ${item}, Count: ${count}`);
    setMenuSelections(prev => {
      const newSelections = { ...prev };
      if (!newSelections[currentDate]) {
        newSelections[currentDate] = {};
      } else {
        newSelections[currentDate] = { ...newSelections[currentDate] }; // **追加：不変性を保つためにコピー**
      }
      if (!newSelections[currentDate][planId]) {
        newSelections[currentDate][planId] = {};
      } else {
        newSelections[currentDate][planId] = { ...newSelections[currentDate][planId] }; // **追加**
      }
      if (!newSelections[currentDate][planId][category]) {
        newSelections[currentDate][planId][category] = {};
      } else {
        newSelections[currentDate][planId][category] = { ...newSelections[currentDate][planId][category] }; // **追加**
      }

      if (count === 0) {
        delete newSelections[currentDate][planId][category][item];
      } else {
        newSelections[currentDate][planId][category][item] = count;
      }

      console.log('Updated Menu Selections:', newSelections);
      return newSelections;
    });
  };

  const calculateTotalPrice = () => {
    const totalPrice = Object.entries(selectedPlans).reduce((sum, [date, plans]) => {
      return sum + Object.entries(plans).reduce((dateSum, [planId, count]) => {
        const plan = foodPlans.find(p => p.id === planId);
        return dateSum + (plan ? plan.price * count : 0);
      }, 0);
    }, 0);
    console.log(`Total Price Calculated: ${totalPrice}`);
    return totalPrice;
  };

  const calculateSubtotal = () => {
    const plans = selectedPlans[currentDate] || {};
    const subtotal = Object.entries(plans).reduce((sum, [planId, count]) => {
      const plan = foodPlans.find(p => p.id === planId);
      return sum + (plan ? plan.price * count : 0);
    }, 0);
    console.log(`Subtotal Calculated for ${currentDate}: ${subtotal}`);
    return subtotal;
  };

  const validateMenuSelections = () => {
    for (const date in selectedPlans) {
      for (const planId in selectedPlans[date]) {
        const plan = foodPlans.find(p => p.id === planId);
        if (plan && plan.menuItems) {
          const selections = menuSelections[date]?.[planId];
          if (!selections) {
            setError(`${plan.name}のメニューが選択されていません。`);
            return false;
          }
          for (const category in plan.menuItems) {
            const selectedCount = Object.values(selections[category] || {}).reduce((sum, count) => sum + count, 0);
            if (selectedCount !== selectedPlans[date][planId]) {
              setError(`${plan.name}の${category}の選択数が不正です。`);
              return false;
            }
          }
        }
      }
    }
    setError(null);
    return true;
  };

  const handleNextDay = () => {
    if (validateMenuSelections()) {
      const currentIndex = dates.indexOf(currentDate);
      if (currentIndex < dates.length - 1) {
        setCurrentDate(dates[currentIndex + 1]);
      } else {
        // 最終日であれば、次のステップに進む
        dispatch({ type: 'SET_FOOD_PLANS_BY_DATE', payload: selectedPlans });
        dispatch({ type: 'SET_TOTAL_MEAL_PRICE', payload: calculateTotalPrice() });
        router.push('/reservation-form'); // 次のページへのパスを指定
      }
    }
  };

  const remainingNoMealGuests = mealGuestCount - Object.values(selectedPlans[currentDate] || {}).reduce((sum, count) => sum + count, 0);
  console.log(`Remaining No Meal Guests for ${currentDate}: ${remainingNoMealGuests}`);

  return (
    <div className="text-[#363331]">
      <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
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
        )}
        
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
      </div>

      {hasMeal === 'yes' && mealGuestCount > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {foodPlans.filter(plan => plan.id !== 'no-meal').map((plan) => {
              const currentCount = selectedPlans[currentDate]?.[plan.id] || 0;
              const totalSelected = Object.values(selectedPlans[currentDate] || {}).reduce((sum, count) => sum + count, 0);
              const remaining = mealGuestCount - (totalSelected - currentCount); // 残り選択可能数
              console.log(`Plan ID: ${plan.id}, Current Count: ${currentCount}, Remaining: ${remaining}`);
              
              return (
                <FoodPlanCard
                  key={plan.id}
                  plan={plan}
                  count={currentCount}
                  onCountChange={(change) => handleCountChange(plan.id, change)}
                  menuSelections={menuSelections[currentDate]?.[plan.id]}
                  onMenuSelection={(category, item, count) => handleMenuSelection(plan.id, category, item, count)}
                  totalPrice={currentCount * plan.price}
                  totalGuests={mealGuestCount}
                  max={remaining} // 残り選択可能数を渡す
                />
              );
            })}
          </div>

          {/* 現在の日付の小計を表示 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-[#363331]">この日の小計</span>
              <span className="text-2xl font-bold text-[#00A2EF]">
                {calculateSubtotal().toLocaleString()}円
              </span>
            </div>
            
            {remainingNoMealGuests > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                ※ 食事なしの人数: {remainingNoMealGuests}名
              </p>
            )}
          </div>

          {/* 全日程の合計金額を表示 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-[#363331]">食事プラン合計金額</span>
              <span className="text-2xl font-bold text-[#00A2EF]">
                {calculateTotalPrice().toLocaleString()}円
              </span>
            </div>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <button
            onClick={handleNextDay}
            className="w-full bg-[#00A2EF] text-white py-2 px-4 rounded-lg text-base font-semibold hover:bg-[#0081BF] transition-colors duration-200"
          >
            {currentDate === dates[dates.length - 1] ? '次へ進む' : '次の日へ'}
          </button>
        </>
      )}

      <FoodPlanSummary
        selectedPlans={selectedPlans}
        foodPlans={foodPlans}
        dates={dates}
      />
    </div>
  );
}

interface FoodPlanSummaryProps {
  selectedPlans: { [date: string]: { [planId: string]: number } };
  foodPlans: FoodPlan[];
  dates: string[];
}

function FoodPlanSummary({ selectedPlans, foodPlans, dates }: FoodPlanSummaryProps) {
  return (
    <div className="mt-8 bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">食事プラン選択サマリー</h3>
      {dates.map((date, index) => {
        const planForDate = selectedPlans[date] || {};
        return (
          <div key={date} className="mb-2">
            <p className="font-medium">{index + 1}日目 ({date}):</p>
            {Object.entries(planForDate).map(([planId, count]) => {
              const plan = foodPlans.find(p => p.id === planId);
              return plan && count > 0 ? (
                <p key={planId} className="ml-4">
                  {plan.name}: {count}名
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
}
