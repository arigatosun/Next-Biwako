// ./src/app/food-plan/page.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import { useReservation } from '@/app/contexts/ReservationContext';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import FoodPlanSelection from '@/app/components/food-plan/FoodPlanSelection';
import ReservationConfirmation from '@/app/components/reservation/ReservationConfirmation';
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
      '主菜': ['サーロインステーキ…150g', '淡路牛…150g'],
      '副菜': ['ピウマスのアヒージョ', 'チキンのアヒージョ', 'つぶ貝のアヒージョ', 'チキントマトクリーム煮'],
      '主食': ['上海風焼きそば', 'ガーリックライス', 'チャーハン']
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

interface GuestSelectionData {
  guestCounts: {
    male: number;
    female: number;
    childWithBed: number;
    childNoBed: number;
  }[];
  totalPrice: number;
  // 他に必要なプロパティがあれば追加
}

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
  const { dispatch } = useReservation();
  const [currentStep, setCurrentStep] = useState(3);
  const [selectedPlans, setSelectedPlans] = useState<{ [key: string]: number }>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [guestSelectionData, setGuestSelectionData] = useState<GuestSelectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuestSelectionData = () => {
      setIsLoading(true);
      setError(null);
      const storedData = localStorage.getItem('guestSelectionData');
      console.log('Stored guestSelectionData:', storedData);

      if (storedData) {
        try {
          const parsedData: GuestSelectionData = JSON.parse(storedData);
          console.log('Parsed guestSelectionData:', parsedData);
          setGuestSelectionData(parsedData);
          setIsLoading(false);
        } catch (error) {
          console.error('Error parsing guestSelectionData:', error);
          setError('データの読み込みに失敗しました。再度お試しください。');
          setIsLoading(false);
        }
      } else {
        console.log('No guestSelectionData found, redirecting to guest-selection');
        router.push('/guest-selection');
      }
    };

    fetchGuestSelectionData();
  }, [router]);

  const handleStepClick = useCallback((step: number) => {
    console.log('handleStepClick called with step:', step);
    switch (step) {
      case 1:
        router.push('/reservation');
        break;
      case 2:
        router.push('/guest-selection');
        break;
      case 5:
        router.push('/reservation-form');
        break;
      default:
        break;
    }
  }, [router]);

  const handlePlanSelection = useCallback(
    (
      plans: { [key: string]: number },
      foodPrice: number,
      menuSelections: { [planId: string]: { [category: string]: { [item: string]: number } } }
    ) => {
      const selectedFoodPlans = Object.entries(plans).reduce((acc, [planId, count]) => {
        if (count > 0) {
          acc[planId] = {
            count,
            menuSelections: menuSelections[planId], // 追加: menuSelections を含める
          };
        }
        return acc;
      }, {} as Record<string, { count: number; menuSelections?: { [category: string]: { [item: string]: number } } }>);
      
      setSelectedPlans(plans);
      const newTotalPrice = foodPrice + (guestSelectionData?.totalPrice || 0);
      setTotalPrice(newTotalPrice);
      
      dispatch({ type: 'SET_FOOD_PLANS', payload: selectedFoodPlans });
      dispatch({ type: 'SET_TOTAL_PRICE', payload: newTotalPrice });
      dispatch({ type: 'SET_TOTAL_MEAL_PRICE', payload: foodPrice }); // 追加: totalMealPrice を設定
    },
    [dispatch, guestSelectionData]
  );

  const initialTotalGuests = guestSelectionData
    ? guestSelectionData.guestCounts.reduce((total: number, counts) => 
        total + counts.male + counts.female + counts.childWithBed + counts.childNoBed, 0)
    : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-2xl font-bold">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-2xl font-bold text-red-500">{error}</div>
        </div>
      </Layout>
    );
  }

  if (!guestSelectionData) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-2xl font-bold">Error: No guest selection data available.</div>
        </div>
      </Layout>
    );
  }

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
              <div className="inline-block border-2 border-[#00A2EF] px-4 sm:px-11 py-1 bg-[#00A2EF]">
                <h2 className="text-base sm:text-xl font-black text-[#FFFFFF] whitespace-nowrap">
                  ＼　<span className="hidden sm:inline">食事プランを</span>お選びください　／
                </h2>
              </div>
            </div>
  
            <div className="bg-white rounded-lg shadow-md p-6">
              <FoodPlanSelection 
                onPlanSelection={handlePlanSelection} 
                foodPlans={foodPlans}
                initialTotalGuests={initialTotalGuests}
              />
              
              {selectedPlans && (
                <ReservationConfirmation 
                  selectedPlans={selectedPlans} 
                  totalPrice={totalPrice}
                  guestSelectionData={guestSelectionData}
                  foodPlans={foodPlans}
                  amenities={amenities}
                  onPersonalInfoClick={() => handleStepClick(5)}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}

function toFullWidth(num: number): string {
  return num.toString().split('').map(char => String.fromCharCode(char.charCodeAt(0) + 0xFEE0)).join('');
}
