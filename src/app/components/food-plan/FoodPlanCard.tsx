'use client';

import React, { useState } from 'react';
import { FoodPlan } from '@/app/types/food-plan';
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
      <div className="bg-white rounded-lg p-6 flex flex-col justify-between items-start shadow-md text-[#363331]">
        <h3 className="text-xl font-semibold mb-2 w-full">食事なし</h3>
        <div className="flex justify-between items-center w-full">
          <p className="text-2xl font-bold text-red-600">0円<span className="text-base font-normal">/人</span></p>
          <CounterButton 
            count={count} 
            onCountChange={(change) => {
              onCountChange(change);
            }} 
            max={totalGuests}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden text-[#363331] shadow-md">
      {plan.images && <ImageCarousel images={plan.images} />}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-3 truncate">{plan.name}</h3>
        <div className="flex justify-between items-center mb-4">
          <p className="text-lg">
            <span className="text-2xl font-bold">{plan.price.toLocaleString()}</span>
            <span className="text-base">円/人</span>
          </p>
          <CounterButton 
            count={count} 
            onCountChange={onCountChange}
            max={totalGuests}
          />
        </div>

        {count > 0 && plan.menuItems && onMenuSelection && (
          <div className="mt-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-full bg-[#00A2EF] text-white py-2 px-4 rounded-lg text-base font-semibold hover:bg-[#0081BF] transition-colors duration-200"
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