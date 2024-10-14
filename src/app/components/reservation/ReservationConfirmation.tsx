import React from 'react';
import { FoodPlan } from '@/types/food-plan';

interface AmenityInfo {
  label: string;
  content: string;
}

interface ReservationConfirmationProps {
  selectedPlans: { [key: string]: number };
  totalPrice: number;
  guestSelectionData: any;
  foodPlans: FoodPlan[];
  amenities: AmenityInfo[];
}

const ReservationConfirmation: React.FC<ReservationConfirmationProps> = ({ 
  selectedPlans, 
  totalPrice,
  guestSelectionData,
  foodPlans,
  amenities
}) => {
  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4 text-[#363331]">予約内容の確認</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h4 className="font-semibold mb-2 text-[#363331]">宿泊情報</h4>
          <p className="text-[#363331]">チェックイン日: {guestSelectionData?.selectedDate}</p>
          <p className="text-[#363331]">宿泊日数: {guestSelectionData?.nights}泊</p>
          <p className="text-[#363331]">棟数: {guestSelectionData?.units}棟</p>
          <p className="text-[#363331]">宿泊人数: {guestSelectionData?.totalGuests}名</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-[#363331]">食事プラン</h4>
          {Object.entries(selectedPlans).map(([planId, count]) => {
            const plan = foodPlans.find(p => p.id === planId);
            return (
              <div key={planId} className="mb-2">
                <p className="text-[#363331] font-semibold">{plan ? plan.name : planId}: {count}名</p>
                {plan && plan.menuItems && (
                  <ul className="text-[#363331] text-sm ml-4">
                    {Object.entries(plan.menuItems).map(([category, items]) => (
                      <li key={category}>
                        {category}: {items.join(', ')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-[#363331]">設備・備品・ポリシー</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {amenities.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-lg">
              <h5 className="font-semibold text-[#363331] mb-2">{item.label}</h5>
              <p className="text-[#363331] text-sm">{item.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-right">
        <span className="text-lg font-semibold mr-2 text-[#363331]">合計金額</span>
        <span className="bg-white px-3 py-2 rounded-lg inline-block text-[#363331]">
          {totalPrice.toLocaleString()}円
        </span>
      </div>
    </div>
  );
};

export default ReservationConfirmation;