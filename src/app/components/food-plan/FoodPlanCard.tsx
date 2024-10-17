// src/app/components/food-plan/FoodPlanCard.tsx

import React from 'react';
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
  max: number;
}

const FoodPlanCard: React.FC<FoodPlanCardProps> = ({
  plan,
  count,
  onCountChange,
  menuSelections,
  onMenuSelection,
  totalPrice,
  totalGuests,
  max,
}) => {
  const handleCountChange = (change: number) => {
    console.log(`handleCountChange called with change: ${change}`);
    onCountChange(change);
  };

  console.log(`FoodPlanCard - Plan ID: ${plan.id}, Count: ${count}, Max: ${max}`);

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
            onCountChange={handleCountChange}
            max={max}
          />
        </div>

        {count > 0 && plan.menuItems && onMenuSelection && (
          <div className="mt-4">
            <MenuSelection
              menuItems={plan.menuItems}
              selections={menuSelections || {}}
              onSelection={onMenuSelection}
              maxCount={count}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodPlanCard;
