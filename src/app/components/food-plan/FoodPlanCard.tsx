'use client';

import React, { useState } from 'react';
import { FoodPlan } from '@/types/food-plan';
import CounterButton from './CounterButton';
import ImageCarousel from './ImageCarousel';
import MenuSelection from './MenuSelection';

interface FoodPlanCardProps {
  plan: FoodPlan;
  count: number;
  onCountChange: (change: number) => void;
  menuSelections?: { [category: string]: { [item: string]: number } };
  onMenuSelection?: (category: string, item: string, count: number) => void;
  totalPrice: number;
  totalGuests: number;
}

export default function FoodPlanCard({ 
  plan, 
  count, 
  onCountChange, 
  menuSelections, 
  onMenuSelection,
  totalPrice,
  totalGuests,
}: FoodPlanCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const pricePerPerson = totalGuests > 0 ? Math.round(totalPrice / totalGuests) : 0;

  if (plan.id === 'no-meal') {
    return (
      <div className="bg-gray-100 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[#363331]">
        <div className="mb-2 sm:mb-0">
          <h3 className="text-base sm:text-lg font-semibold">食事なし</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-600">
            0円/人
          </p>
        </div>
        <CounterButton 
          count={count} 
          onCountChange={(change) => {
            onCountChange(change);
          }} 
          max={totalGuests}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 rounded-lg overflow-hidden text-[#363331]">
      {plan.images && <ImageCarousel images={plan.images} />}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-0">{plan.name}</h3>
          <div className="flex items-center">
            <span className="mr-2 text-sm sm:text-base">{plan.price.toLocaleString()}円/人</span>
            <CounterButton 
              count={count} 
              onCountChange={onCountChange}
              max={totalGuests}
            />
          </div>
        </div>

        {count > 0 && plan.menuItems && onMenuSelection && (
          <div className="mt-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm sm:text-base"
            >
              {isMenuOpen ? 'メニューをとじる' : 'メニューをみる'}
            </button>
            {isMenuOpen && (
              <MenuSelection
                menuItems={plan.menuItems}
                selections={menuSelections || {}}
                onSelection={onMenuSelection}
                maxCount={count}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}