'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import FoodPlanSelection from '@/app/components/food-plan/FoodPlanSelection';
import ReservationConfirmation from '@/app/components/reservation/ReservationConfirmation';
import { FoodPlan } from '@/types/food-plan';

// 食事プランのデータ
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

// 設備・備品・ポリシーのデータ
const amenities = [
  { label: '設備', content: 'エアコン、コンセント、無料Wi-Fi、IHコンロ1口' },
  { label: '備品', content: 'BBQコンロ、冷蔵庫（冷凍庫有り）、電気ケトル、電子レンジ、炊飯器5.5合、ウォーターサーバー' },
  { label: '調理器具', content: '包丁、まな板、栓抜き、鍋、フライパン、ざる、ボウル、フライ返し、おたま、菜箸など' },
  { label: '食器', content: 'お皿やコップ、フォーク、スプーン、お箸など' },
  { label: 'アメニティ', content: 'ドライヤー、シャンプー、ボディーソープ、歯ブラシ、タオル' },
  { label: 'お支払い方法', content: '現地決済またはクレジット事前決済（タイムデザイン手配旅行）' },
  { label: 'キャンセルポリシー', content: '30日前から50%、7日前から100%' },
];

export default function FoodPlanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(3);
  const [selectedPlans, setSelectedPlans] = useState<{ [key: string]: number }>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [guestSelectionData, setGuestSelectionData] = useState<any>(null);

  useEffect(() => {
    // Fetch guest selection data from localStorage
    const storedData = localStorage.getItem('guestSelectionData');
    if (storedData) {
      setGuestSelectionData(JSON.parse(storedData));
    }
  }, []);

  const handleStepClick = (step: number) => {
    switch (step) {
      case 1:
        router.push('/reservation');
        break;
      case 2:
        router.push('/guest-selection');
        break;
      case 4:
        router.push('/reservation-form');
        break;
      default:
        break;
    }
  };

  const handlePlanSelection = (plans: { [key: string]: number }, foodPrice: number) => {
    setSelectedPlans(plans);
    const accommodationPrice = guestSelectionData ? guestSelectionData.totalPrice : 0;
    setTotalPrice(foodPrice + accommodationPrice);
  };

  return (
    <Layout>
      <div className="bg-gray-100 overflow-x-hidden">
        <main className="container mx-auto px-3 py-8 sm:px-4 sm:py-12 max-w-6xl">
          <div className="space-y-6">
            <ReservationProcess 
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
            
            <div className="flex justify-center mb-6">
              <div className="inline-block border-2 border-[#00A2EF] px-11 py-1 bg-[#00A2EF]">
                <h2 className="text-xl font-black text-[#FFFFFF]">
                  ＼　食事プランをお選びください　／
                </h2>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <FoodPlanSelection onPlanSelection={handlePlanSelection} foodPlans={foodPlans} />
              
              {Object.keys(selectedPlans).length > 0 && (
                <>
                  <div className="my-8 border-t border-gray-300"></div>
                  <ReservationConfirmation 
                    selectedPlans={selectedPlans} 
                    totalPrice={totalPrice}
                    guestSelectionData={guestSelectionData}
                    foodPlans={foodPlans}
                    amenities={amenities}
                  />
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}