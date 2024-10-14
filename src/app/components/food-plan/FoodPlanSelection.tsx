'use client';

import React, { useState, useEffect } from 'react';
import CounterButton from './CounterButton';
import FoodPlanCard from './FoodPlanCard';
import { FoodPlan } from '@/types/food-plan';

interface FoodPlanSelectionProps {
  onPlanSelection: (plans: { [key: string]: number }, totalPrice: number) => void;
  foodPlans: FoodPlan[];
  initialTotalGuests: number;
}

export default function FoodPlanSelection({ onPlanSelection, foodPlans, initialTotalGuests }: FoodPlanSelectionProps) {
    const [hasMeal, setHasMeal] = useState(false);
    const [mealGuestCount, setMealGuestCount] = useState(0);
    const [selectedCounts, setSelectedCounts] = useState<{ [key: string]: number }>({});
  
    // 食事の有無を切り替える関数
    const toggleHasMeal = () => {
      setHasMeal(!hasMeal);
      if (!hasMeal) {
        setMealGuestCount(initialTotalGuests);
      } else {
        setMealGuestCount(0);
        setSelectedCounts({});
      }
    };
  
    // 食事が必要な人数を変更する関数
    const handleMealGuestCountChange = (change: number) => {
      const newCount = Math.max(0, Math.min(mealGuestCount + change, initialTotalGuests));
      setMealGuestCount(newCount);
      
      // 食事プランの選択をリセット
      setSelectedCounts({});
    };
  
    // 各食事プランの人数を変更する関数
    const handleCountChange = (id: string, change: number) => {
      setSelectedCounts(prev => {
        const newCounts = { ...prev };
        newCounts[id] = Math.max(0, (prev[id] || 0) + change);
        
        // 選択された食事プランの合計人数が mealGuestCount を超えないようにする
        const totalSelected = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
        if (totalSelected > mealGuestCount) {
          newCounts[id] = Math.max(0, newCounts[id] - (totalSelected - mealGuestCount));
        }
        
        return newCounts;
      });
    };
  
    // 残りの食事なしの人数を計算
    const remainingNoMealGuests = initialTotalGuests - mealGuestCount;
  
    // 合計金額の計算
    const totalPrice = Object.entries(selectedCounts).reduce((sum, [id, count]) => {
      const plan = foodPlans.find(p => p.id === id);
      return sum + (plan ? plan.price * count : 0);
    }, 0);
  
    useEffect(() => {
      onPlanSelection(selectedCounts, totalPrice);
    }, [selectedCounts, totalPrice, onPlanSelection]);
  
    return (
      <div className="text-[#363331]">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">食事プランをご選択ください</h2>
        <div className="mb-6 sm:mb-8 p-4 bg-gray-100 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">食事の有無</span>
            <button
              onClick={toggleHasMeal}
              className={`px-4 py-2 rounded-full ${
                hasMeal ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
              }`}
            >
              {hasMeal ? '食事あり' : '食事なし'}
            </button>
          </div>
          {hasMeal && (
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">食事が必要な人数</span>
              <CounterButton
                count={mealGuestCount}
                onCountChange={handleMealGuestCountChange}
                max={initialTotalGuests}
              />
            </div>
          )}
          {!hasMeal && (
            <p className="text-center text-lg font-semibold">全員食事なし（{initialTotalGuests}名）</p>
          )}
        </div>
  
        {hasMeal && mealGuestCount > 0 && (
          <>
            <p className="text-sm sm:text-base text-center mb-4">
              食事プランを選択してください（残り：{mealGuestCount - Object.values(selectedCounts).reduce((sum, count) => sum + count, 0)}名）
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {foodPlans.filter(plan => plan.id !== 'no-meal').map((plan) => (
                <FoodPlanCard
                  key={plan.id}
                  plan={plan}
                  count={selectedCounts[plan.id] || 0}
                  onCountChange={(change) => handleCountChange(plan.id, change)}
                  totalPrice={totalPrice}
                  totalGuests={mealGuestCount}
                  totalMealPlans={Object.values(selectedCounts).reduce((sum, count) => sum + count, 0)}
                />
              ))}
            </div>
          </>
        )}
  
        <div className="text-right mt-6 sm:mt-8">
          <span className="text-base sm:text-lg font-semibold mr-2">合計</span>
          <span className="bg-gray-100 px-3 py-2 rounded-lg inline-block text-base sm:text-lg">
            {totalPrice.toLocaleString()}円
          </span>
        </div>
        
        {remainingNoMealGuests > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            ※ 食事なしの人数: {remainingNoMealGuests}名
          </p>
        )}
      </div>
    );
  }