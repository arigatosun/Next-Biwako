'use client';

import React, { useState, useEffect } from 'react';
import FoodPlanCard from './FoodPlanCard';
import { FoodPlan } from '@/types/food-plan';

const foodPlans: FoodPlan[] = [
  { id: 'no-meal', name: '食事なし', price: 0 },
  {
    id: 'plan-a',
    name: 'plan.A 贅沢素材のディナーセット',
    price: 6500,
    images: [
      '/images/plan-a/2025.webp',
      '/images/plan-a/2026.webp',
      '/images/plan-a/2027.webp',
      '/images/plan-a/2028.webp',
      '/images/plan-a/2029.webp',
      '/images/plan-a/2030.webp'
    ],
    menuItems: {
      'ステーキ': ['サーロインステーキ…150g', '淡路牛…150g'],
      'アヒージョ': ['ピウマスのアヒージョ', 'チキンのアヒージョ', 'つぶ貝のアヒージョ', 'チキントマトクリーム煮'],
      '米類': ['上海風焼きそば', 'ガーリックライス', 'チャーハン']
    }
  },
  {
    id: 'plan-b',
    name: 'plan.B お肉づくし！豪華BBQセット',
    price: 6500,
    images: [
      '/images/plan-b/2031.webp',
      '/images/plan-b/2032.webp',
      '/images/plan-b/2033.webp'
    ],
    menuItems: {
      'ステーキ': ['牛フィレステーキ…150g', 'サーロインステーキ…150g']
    }
  },
  {
    id: 'plan-c',
    name: '大満足！よくばりお子さまセット',
    price: 3000,
    images: [
      '/images/plan-c/2034.webp',
      '/images/plan-c/2035.webp'
    ]
  }
];

interface FoodPlanSelectionProps {
  onPlanSelection: (plans: { [key: string]: number }, totalPrice: number) => void;
}

export default function FoodPlanSelection({ onPlanSelection }: FoodPlanSelectionProps) {
  const [selectedCounts, setSelectedCounts] = useState<{ [key: string]: number }>({
    'no-meal': 2,
    'plan-a': 2,
    'plan-b': 2,
    'plan-c': 2
  });

  const [menuSelections, setMenuSelections] = useState<{
    [planId: string]: {
      [category: string]: { [item: string]: number }
    }
  }>({});

  const handleCountChange = (id: string, change: number) => {
    setSelectedCounts(prev => ({ ...prev, [id]: Math.max(0, prev[id] + change) }));
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

  const totalPrice = Object.entries(selectedCounts).reduce((sum, [id, count]) => {
    const plan = foodPlans.find(p => p.id === id);
    return sum + (plan ? plan.price * count : 0);
  }, 0);

  useEffect(() => {
    onPlanSelection(selectedCounts, totalPrice);
  }, [selectedCounts, totalPrice, onPlanSelection]);

  return (
    <div className="text-[#363331]"> {/* テキストカラーを元に戻す */}
      <h2 className="text-2xl font-bold mb-6 text-center">食事プランをご記入ください</h2>
      <p className="text-center mb-4">1名様ずつお好きなプランをご注文いただけます。</p>
      <p className="text-center mb-6">例）5名様でご利用の場合、plan.Aを2名・plan.Bを1名にし、残りを持ち込みにすることも可能です。</p>

      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <FoodPlanCard
          plan={foodPlans[0]}
          count={selectedCounts[foodPlans[0].id]}
          onCountChange={(change) => handleCountChange(foodPlans[0].id, change)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {foodPlans.slice(1).map((plan) => (
          <FoodPlanCard
            key={plan.id}
            plan={plan}
            count={selectedCounts[plan.id]}
            onCountChange={(change) => handleCountChange(plan.id, change)}
            menuSelections={menuSelections[plan.id] || {}}
            onMenuSelection={(category, item, count) => handleMenuSelection(plan.id, category, item, count)}
          />
        ))}
      </div>

      <div className="text-right mt-8">
        <span className="text-lg font-semibold mr-2">合計</span>
        <span className="bg-gray-100 px-3 py-2 rounded-lg inline-block">{totalPrice}円</span>
      </div>
    </div>
  );
}