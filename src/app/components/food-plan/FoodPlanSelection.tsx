'use client';

import React, { useState, useEffect } from 'react';
import { FoodPlan } from '@/app/types/food-plan';
import FoodPlanCard from './FoodPlanCard';

interface FoodPlanSelectionProps {
  onPlanSelection: (
    plans: { [key: string]: number },
    totalPrice: number,
    menuSelections: { [planId: string]: { [category: string]: { [item: string]: number } } }
  ) => void;
  foodPlans: FoodPlan[];
  initialTotalGuests: number;
}

export default function FoodPlanSelection({ 
  onPlanSelection, 
  foodPlans, 
  initialTotalGuests
}: FoodPlanSelectionProps) {
  const [hasMeal, setHasMeal] = useState<'yes' | 'no'>('no');
  const [mealGuestCount, setMealGuestCount] = useState(0);
  const [selectedCounts, setSelectedCounts] = useState<{ [key: string]: number }>({});
  const [menuSelections, setMenuSelections] = useState<{ [planId: string]: { [category: string]: { [item: string]: number } } }>({});

  const handleMealOptionChange = (value: 'yes' | 'no') => {
    setHasMeal(value);
    if (value === 'no') {
      setMealGuestCount(0);
      setSelectedCounts({});
      setMenuSelections({});
    } else {
      setMealGuestCount(initialTotalGuests);
    }
  };

  const handleMealGuestCountChange = (change: number) => {
    setMealGuestCount(prev => {
      const newCount = Math.max(0, Math.min(prev + change, initialTotalGuests));
      if (newCount < prev) {
        setSelectedCounts({});
        setMenuSelections({});
      }
      return newCount;
    });
  };

  const handleCountChange = (planId: string, change: number) => {
    setSelectedCounts(prev => {
      const newCount = Math.max(0, (prev[planId] || 0) + change);
      const newCounts = { ...prev, [planId]: newCount };
      
      if (newCount === 0 || newCount !== prev[planId]) {
        setMenuSelections(prevSelections => {
          const newSelections = { ...prevSelections };
          delete newSelections[planId];
          return newSelections;
        });
      }
      
      const totalSelected = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
      if (totalSelected > mealGuestCount) {
        newCounts[planId] = Math.max(0, newCount - (totalSelected - mealGuestCount));
      }
      
      return newCounts;
    });
  };

  const handleMenuSelection = (planId: string, category: string, item: string, count: number) => {
    setMenuSelections(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [category]: {
          ...prev[planId]?.[category],
          [item]: count
        }
      }
    }));
  };

  const calculateTotalPrice = () => {
    return Object.entries(selectedCounts).reduce((sum, [id, count]) => {
      const plan = foodPlans.find(p => p.id === id);
      return sum + (plan ? plan.price * count : 0);
    }, 0);
  };

  useEffect(() => {
    const totalPrice = calculateTotalPrice();
    onPlanSelection(selectedCounts, totalPrice, menuSelections);
  }, [selectedCounts, menuSelections, onPlanSelection]);

  const remainingNoMealGuests = mealGuestCount - Object.values(selectedCounts).reduce((sum, count) => sum + count, 0);

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
                count={selectedCounts[plan.id] || 0}
                onCountChange={(change) => handleCountChange(plan.id, change)}
                menuSelections={menuSelections[plan.id]}
                onMenuSelection={(category, item, count) => handleMenuSelection(plan.id, category, item, count)}
                totalPrice={plan.price * (selectedCounts[plan.id] || 0)}
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
    </div>
  );
}