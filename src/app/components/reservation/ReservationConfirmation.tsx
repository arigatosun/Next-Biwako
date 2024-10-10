import React from 'react';
import { FoodPlan } from '@/types/food-plan';

interface ReservationConfirmationProps {
  selectedPlans: { [key: string]: number };
  totalPrice: number;
}

const foodPlans: FoodPlan[] = [
  { id: 'no-meal', name: '食事なし', price: 0 },
  { id: 'plan-a', name: 'plan.A 贅沢素材のディナーセット', price: 6500 },
  { id: 'plan-b', name: 'plan.B お肉づくし！豪華BBQセット', price: 6500 },
  { id: 'plan-c', name: '大満足！よくばりお子さまセット', price: 3000 }
];

const ReservationConfirmation: React.FC<ReservationConfirmationProps> = ({ selectedPlans, totalPrice }) => {
  const totalGuests = Object.values(selectedPlans).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-[#F7F7F7] p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">予約内容の確認</h2>
      
      <div className="bg-white rounded-lg p-4 mb-6 shadow-md">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-[#363331]">合計金額</span>
          <div>
            <span className="text-4xl font-bold text-[#00A2EF]">{totalPrice.toLocaleString()}</span>
            <span className="text-xl text-[#363331]">円</span>
            <span className="text-sm text-gray-500 ml-2">(一人あたり 約{Math.round(totalPrice / totalGuests).toLocaleString()}円)</span>
          </div>
        </div>
      </div>

      <div className="bg-[#363331] text-white p-3 rounded-t-lg">
        <h3 className="text-lg font-semibold">選択された食事プラン</h3>
      </div>
      <div className="bg-white p-4 rounded-b-lg mb-6">
        {Object.entries(selectedPlans).map(([planId, count]) => {
          const plan = foodPlans.find(p => p.id === planId);
          if (plan && count > 0) {
            return (
              <div key={planId} className="flex justify-between items-center mb-2">
                <span>{plan.name}</span>
                <span>{count}名 × {plan.price.toLocaleString()}円 = {(count * plan.price).toLocaleString()}円</span>
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="bg-[#363331] text-white p-3 rounded-t-lg">
        <h2 className="text-lg font-semibold">設備・備品</h2>
      </div>
      <div className="bg-white p-4 rounded-b-lg mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
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
        {[
          { label: '設備', content: 'エアコン、コンセント、無料Wi-Fi、IHコンロ1口' },
          { label: '備品', content: 'BBQコンロ、冷蔵庫（冷凍庫有り）、電気ケトル、電子レンジ、炊飯器5.5合、ウォーターサーバー' },
          { label: '調理器具', content: '包丁、まな板、栓抜き、鍋、フライパン、ざる、ボウル、フライ返し、おたま、菜箸など' },
          { label: '食器', content: 'お皿やコップ、フォーク、スプーン、お箸など' },
          { label: 'アメニティ', content: 'ドライヤー、シャンプー、ボディーソープ、歯ブラシ、タオル' },
          { label: 'お支払い方法', content: '現地決済またはクレジット事前決済（タイムデザイン手配旅行）' },
          { label: 'キャンセルポリシー', content: '30日前から50%、7日前から100%' },
        ].map((item, index) => (
          <div key={index} className="flex py-2 border-b border-gray-300 last:border-b-0">
            <span className="bg-[#E6E6E6] text-[#363331] font-semibold px-3 py-1 rounded-lg w-32 text-center mr-4">
              {item.label}
            </span>
            <span className="flex-1 text-[#363331]">{item.content}</span>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button className="bg-[#00A2EF] text-white py-3 px-6 rounded-full text-lg font-semibold hover:bg-blue-600 transition duration-300">
          個人情報入力 ＞
        </button>
      </div>
    </div>
  );
};

export default ReservationConfirmation;