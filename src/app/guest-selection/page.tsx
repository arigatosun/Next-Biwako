'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import RoomInformationSlider from '../components/Guest-selection/RoomInformationSlider';
import DateSelector from '../components/Guest-selection/DateSelector';
import Link from 'next/link';

interface GuestCounts {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

const fetchPrice = async (date: Date, units: number): Promise<number> => {
  const basePrice = 50000;
  const seasonMultiplier = date.getMonth() >= 6 && date.getMonth() <= 8 ? 1.5 : 1;
  return basePrice * units * seasonMultiplier;
};

export default function GuestSelectionPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(2);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2024/10/21'));
  const [nights, setNights] = useState(1);
  const [units, setUnits] = useState(2);
  const [guestCounts, setGuestCounts] = useState<GuestCounts[]>([
    { male: 3, female: 0, childWithBed: 0, childNoBed: 0 },
    { male: 0, female: 3, childWithBed: 0, childNoBed: 2 },
  ]);
  const [totalPrice, setTotalPrice] = useState<number | null>(null);

  const totalGuests = guestCounts.reduce((total, unit) => 
    total + Object.values(unit).reduce((sum, count) => sum + count, 0), 0
  );

  const handleStepClick = (step: number) => {
    switch (step) {
      case 1:
        router.push('/reservation');
        break;
      case 3:
        router.push('/food-plan');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const updatePrice = async () => {
      const price = await fetchPrice(selectedDate, units);
      setTotalPrice(price);
    };
    updatePrice();
  }, [selectedDate, units]);

  const toFullWidth = (num: number): string => {
    return num.toString().split('').map(char => String.fromCharCode(char.charCodeAt(0) + 0xFEE0)).join('');
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col bg-gray-100 font-[UDShinGoCOnizPr6N] overflow-y-auto">
        <div className="container mx-auto px-3 py-8 sm:px-4 sm:py-10 max-w-6xl">
          <div className="space-y-6">
            <ReservationProcess 
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
            
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
              <div className="bg-white rounded-t-3xl p-4">
                <h2 className="text-[#00A2EF] text-xl font-bold text-center">
                  【一棟貸切！】贅沢遊びつくしヴィラプラン
                </h2>
                <div className="text-center text-[#00A2EF] text-2xl mt-1">▼</div>
              </div>
              
              <RoomInformationSlider />
              
              <div className="p-4 sm:p-6">
                <DateSelector 
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  nights={nights}
                  setNights={setNights}
                  units={units}
                  setUnits={setUnits}
                  guestCounts={guestCounts}
                  setGuestCounts={setGuestCounts}
                />
                <div className="mt-4 flex justify-end">
                  <div className="flex items-center space-x-2 mr-4 sm:mr-[90px]">
                    <span className="text-base sm:text-lg font-extrabold mr-2 text-black">合計</span>
                    <span className="bg-gray-100 px-3 py-2 sm:py-3 rounded-lg font-extrabold inline-block text-black">
                      {toFullWidth(totalGuests)}人
                    </span>
                  </div>
                </div>
                <div className="mt-8 flex justify-center">
                  <Link href="/food-plan" className="bg-[#00A2EF] text-white font-bold py-3 px-6 rounded-full hover:bg-blue-600 transition duration-300 text-sm sm:text-base">
                    食事プラン選択へ進む
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}