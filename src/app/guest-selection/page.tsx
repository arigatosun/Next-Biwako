'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import RoomInformationSlider from '../components/Guest-selection/RoomInformationSlider';
import DateSelector from '../components/Guest-selection/DateSelector';
import { useReservation } from '@/app/contexts/ReservationContext';

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
  const { state, dispatch } = useReservation();
  const [currentStep, setCurrentStep] = useState(2);
  const [nights, setNights] = useState(1);
  const [units, setUnits] = useState(1);
  const [guestCounts, setGuestCounts] = useState<GuestCounts[]>([
    { male: 0, female: 0, childWithBed: 0, childNoBed: 0 },
  ]);
  const [totalPrice, setTotalPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!state.selectedDate) {
      router.push('/reservation');
    } else {
      const updatePrice = async () => {
        const price = await fetchPrice(state.selectedDate!, units);
        setTotalPrice(price);
      };
      updatePrice();
    }
  }, [state.selectedDate, units, router]);

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

  const handleGuestCountChange = (newGuestCounts: GuestCounts[]) => {
    setGuestCounts(newGuestCounts);
    dispatch({ type: 'SET_GUEST_COUNTS', payload: newGuestCounts });
  };

  const handleNightsChange = (newNights: number) => {
    setNights(newNights);
    dispatch({ type: 'SET_NIGHTS', payload: newNights });
  };

  const handleUnitsChange = (newUnits: number) => {
    setUnits(newUnits);
    dispatch({ type: 'SET_UNITS', payload: newUnits });
  };

  const totalGuests = guestCounts.reduce((total, unit) => 
    total + Object.values(unit).reduce((sum, count) => sum + count, 0), 0
  );

  const toFullWidth = (num: number): string => {
    return num.toString().split('').map(char => String.fromCharCode(char.charCodeAt(0) + 0xFEE0)).join('');
  };

  const handleNextStep = () => {
    const guestSelectionData = {
      selectedDate: state.selectedDate,
      nights,
      units,
      guestCounts,
      totalPrice,
      totalGuests,
    };
    console.log('Saving guestSelectionData:', guestSelectionData); // デバッグログ
    localStorage.setItem('guestSelectionData', JSON.stringify(guestSelectionData));
    router.push('/food-plan');
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
                  selectedDate={state.selectedDate || new Date()}
                  setSelectedDate={(date) => dispatch({ type: 'SET_DATE', payload: date })}
                  nights={nights}
                  setNights={handleNightsChange}
                  units={units}
                  setUnits={handleUnitsChange}
                  guestCounts={guestCounts}
                  setGuestCounts={handleGuestCountChange}
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
                  <button
                    onClick={handleNextStep}
                    className="bg-[#00A2EF] text-white font-bold py-3 px-6 rounded-full hover:bg-blue-600 transition duration-300 text-sm sm:text-base"
                  >
                    食事プラン選択へ進む
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}