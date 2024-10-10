'use client';

import { useState } from 'react';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import RoomInformationSlider from '../components/Guest-selection/RoomInformationSlider';
import DateSelector from '../components/Guest-selection/DateSelector';

interface GuestCounts {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

export default function GuestSelectionPage() {
  const [currentStep, setCurrentStep] = useState(2);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2024/10/21'));
  const [nights, setNights] = useState(1);
  const [units, setUnits] = useState(2);
  const [guestCounts, setGuestCounts] = useState<GuestCounts[]>([
    { male: 3, female: 0, childWithBed: 0, childNoBed: 0 },
    { male: 0, female: 3, childWithBed: 0, childNoBed: 2 },
  ]);

  const totalGuests = guestCounts.reduce((total, unit) => 
    total + Object.values(unit).reduce((sum, count) => sum + count, 0), 0
  );

  const handleNextStep = () => {
    setCurrentStep(prevStep => prevStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prevStep => Math.max(1, prevStep - 1));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-[UDShinGoCOnizPr6N] overflow-y-auto">
      <div className="container mx-auto px-3 py-18 sm:px-4 sm:py-20 max-w-6xl">
        <div className="space-y-6">
          <ReservationProcess 
            currentStep={currentStep} 
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
          />
          
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="bg-white rounded-t-3xl p-4">
              <h2 className="text-[#00A2EF] text-xl font-bold text-center">
                【一棟貸切！】贅沢遊びつくしヴィラプラン
              </h2>
              <div className="text-center text-[#00A2EF] text-2xl mt-1">▼</div>
            </div>
            
            <RoomInformationSlider />
            
            <div className="p-6">
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
              <div className="mt-4 text-right">
                <span className="text-lg font-semibold mr-2">合計</span>
                <span className="bg-gray-100 px-3 py-2 rounded-lg inline-block">{totalGuests}人</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}