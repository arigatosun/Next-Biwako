import React from 'react';
import { FoodPlan } from '@/types/food-plan';

interface ReservationConfirmationProps {
  selectedPlans: { [key: string]: number };
  totalPrice: number;
  guestSelectionData?: any; // optional
  foodPlans: FoodPlan[];
  amenities: { label: string; content: string }[];
  onPersonalInfoClick: () => void;
}

const ReservationConfirmation: React.FC<ReservationConfirmationProps> = ({ 
  selectedPlans, 
  totalPrice, 
  guestSelectionData,
  foodPlans,
  amenities,
  onPersonalInfoClick
}) => {
  const totalGuests = guestSelectionData?.totalGuests ?? 0;
  const mealGuests = Object.values(selectedPlans).reduce((sum, count) => sum + count, 0);
  const noMealGuests = totalGuests - mealGuests;

  return (
    <div className="bg-[#F7F7F7] p-4 sm:p-6 rounded-lg">
      <h2 className="bg-[#363331] text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-white p-3 rounded-lg">予約内容の確認</h2>
      
      <div className="bg-white rounded-lg p-4 mb-4 sm:mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <span className="text-base sm:text-lg font-semibold text-[#363331] mb-2 sm:mb-0">合計金額</span>
          <div className="text-center sm:text-right">
            <span className="text-3xl sm:text-4xl font-bold text-[#00A2EF]">{totalPrice.toLocaleString()}</span>
            <span className="text-lg sm:text-xl text-[#363331]">円</span>
            <span className="block sm:inline text-sm text-gray-500 mt-1 sm:mt-0 sm:ml-2">
              (一人あたり 約{totalGuests > 0 ? Math.round(totalPrice / totalGuests).toLocaleString() : 0}円)
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#363331] text-white p-3 rounded-t-lg">
        <h3 className="text-base sm:text-lg font-semibold">選択された食事プラン</h3>
      </div>
      <div className="bg-white p-4 rounded-b-lg mb-4 sm:mb-6 text-[#363331]">
        {Object.entries(selectedPlans).map(([planId, count]) => {
          const plan = foodPlans.find(p => p.id === planId);
          if (plan && count > 0) {
            return (
              <div key={planId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <span className="mb-1 sm:mb-0">{plan.name}</span>
                <span>{count}名 × {plan.price.toLocaleString()}円 = {(count * plan.price).toLocaleString()}円</span>
              </div>
            );
          }
          return null;
        })}
        {noMealGuests > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
            <span className="mb-1 sm:mb-0">食事なし</span>
            <span>{noMealGuests}名 × 0円 = 0円</span>
          </div>
        )}
      </div>

      <div className="bg-[#363331] text-white p-3 rounded-t-lg">
        <h2 className="text-base sm:text-lg font-semibold">設備・備品</h2>
      </div>
      <div className="bg-white p-4 rounded-b-lg mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[
            { label: 'チェックイン', content: '15:00' },
            { label: 'チェックアウト', content: '11:00' },
            { label: '駐車場', content: '無料駐車場有り' },
          ].map((item, index) => (
            <div key={index} className="bg-[#E6E6E6] rounded-lg p-2">
              <span className="font-semibold text-[#363331]">{item.label}</span>
              <p className="text-[#363331]">{item.content}</p>
            </div>
          ))}
        </div>
        {amenities.map((item, index) => (
          <div key={index} className="flex flex-col sm:flex-row py-2 border-b border-gray-300 last:border-b-0">
            <span className="bg-[#E6E6E6] text-[#363331] font-semibold px-3 py-1 rounded-lg w-full sm:w-32 text-center mb-2 sm:mb-0 sm:mr-4">
              {item.label}
            </span>
            <span className="flex-1 text-[#363331]">{item.content}</span>
          </div>
        ))}
      </div>
      <div className="text-center">
      <button 
  className="bg-[#00A2EF] text-white py-2 sm:py-3 px-4 sm:px-6 rounded-full text-base sm:text-lg font-semibold hover:bg-blue-600 transition duration-300"
  onClick={onPersonalInfoClick}
>
  個人情報入力 ＞
</button>
      </div>
    </div>
  );
};

export default ReservationConfirmation;