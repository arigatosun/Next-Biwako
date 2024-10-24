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
  console.log(`FoodPlanCard - Plan ID: ${plan.id}, Count: ${count}, Max: ${max}`);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {plan.images && <ImageCarousel images={plan.images} />}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-bold">
            {plan.price.toLocaleString()}
            <span className="text-sm font-normal">円/人</span>
          </div>
          <CounterButton
            count={count}
            onCountChange={onCountChange}
            max={max}
          />
        </div>
        {count > 0 && plan.menuItems && onMenuSelection && (
          <MenuSelection
            menuItems={plan.menuItems}
            onSelection={onMenuSelection}
            selections={menuSelections || {}}
            totalGuests={count}
          />
        )}
      </div>
    </div>
  );
};

export default FoodPlanCard;
