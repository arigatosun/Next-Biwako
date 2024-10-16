'use client';

import React, { useState, useEffect } from 'react';
import { FoodPlan } from '@/app/types/food-plan';
import FoodPlanCard from './FoodPlanCard';
import { parse, format, addDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface FoodPlanSelectionProps {
  onPlanSelection: (
    plans: { [key: string]: { [date: string]: number } },
    totalPrice: number,
    menuSelections: { [date: string]: { [planId: string]: { [category: string]: { [item: string]: number } } } }
  ) => void;
  foodPlans: FoodPlan[];
  initialTotalGuests: number;
  checkInDate: string;
  nights: number;
  dates: string[];  // 新しい props
}

export default function FoodPlanSelection({ 
  onPlanSelection, 
  foodPlans, 
  initialTotalGuests,
  checkInDate,
  nights,
  dates
}: FoodPlanSelectionProps) {
  const [currentDate, setCurrentDate] = useState<string>(checkInDate);
  const [selectedPlans, setSelectedPlans] = useState<{ [key: string]: { [date: string]: number } }>({});
  const [menuSelections, setMenuSelections] = useState<{ [date: string]: { [planId: string]: { [category: string]: { [item: string]: number } } } }>({});
  const [hasMeal, setHasMeal] = useState<'yes' | 'no'>('no');
  const [mealGuestCount, setMealGuestCount] = useState(0);

  useEffect(() => {
    const totalPrice = calculateTotalPrice();
    onPlanSelection(selectedPlans, totalPrice, menuSelections);
  }, [selectedPlans, menuSelections, onPlanSelection]);

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

  const handleCountChange = (planId: string, change: number) => {
    setSelectedPlans(prev => {
      const newPlans = { ...prev };
      const currentCount = newPlans[currentDate]?.[planId] || 0;
      const newCount = Math.max(0, currentCount + change);
      
      if (!newPlans[currentDate]) {
        newPlans[currentDate] = {};
      }
      
      if (newCount === 0) {
        delete newPlans[currentDate][planId];
      } else {
        newPlans[currentDate][planId] = newCount;
      }
      
      const totalSelected = Object.values(newPlans[currentDate]).reduce((sum, count) => sum + count, 0);
      if (totalSelected > mealGuestCount) {
        newPlans[currentDate][planId] = Math.max(0, newCount - (totalSelected - mealGuestCount));
      }
      
      return newPlans;
    });
  };

  const handleMenuSelection = (planId: string, category: string, item: string, count: number) => {
    setMenuSelections(prev => ({
      ...prev,
      [currentDate]: {
        ...prev[currentDate],
        [planId]: {
          ...prev[currentDate]?.[planId],
          [category]: {
            ...prev[currentDate]?.[planId]?.[category],
            [item]: count
          }
        }
      }
    }));
  };

  const calculateTotalPrice = () => {
    return Object.entries(selectedPlans).reduce((sum, [date, plans]) => {
      return sum + Object.entries(plans).reduce((dateSum, [planId, count]) => {
        const plan = foodPlans.find(p => p.id === planId);
        return dateSum + (plan ? plan.price * count : 0);
      }, 0);
    }, 0);
  };

  const remainingNoMealGuests = mealGuestCount - Object.values(selectedPlans[currentDate] || {}).reduce((sum, count) => sum + count, 0);

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
        <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-2">日付を選択:</label>
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
        <p className="text-lg text-center mb-6 font-semibold text-[#00A2EF]">
          食事プランを選択してください（残り：{remainingNoMealGuests}名）
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {foodPlans.filter(plan => plan.id !== 'no-meal').map((plan) => (
            <FoodPlanCard
              key={plan.id}
              plan={plan}
              count={selectedPlans[currentDate]?.[plan.id] || 0}
              onCountChange={(change) => handleCountChange(plan.id, change)}
              menuSelections={menuSelections[currentDate]?.[plan.id]}
              onMenuSelection={(category, item, count) => handleMenuSelection(plan.id, category, item, count)}
              totalPrice={(selectedPlans[currentDate]?.[plan.id] || 0) * plan.price}
              totalGuests={mealGuestCount}
            />
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold text-[#363331]">食事プラン合計金額</span>
            <span className="text-2xl font-bold text-[#00A2EF]">
              {calculateTotalPrice().toLocaleString()}円
            </span>
          </div>
          
          {remainingNoMealGuests > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              ※ 食事なしの人数: {remainingNoMealGuests}名
            </p>
          )}
        </div>
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
selectedPlans: { [key: string]: { [date: string]: number } };
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