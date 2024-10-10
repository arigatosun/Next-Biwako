'use client';

import { useState, useEffect } from 'react';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import RoomInformation from '@/app/components/reservation/RoomInformation';
import ReservationCalendar from '@/app/components/reservation/ReservationCalendar';

export default function ReservationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentStep(2);
  };

  useEffect(() => {
    if (selectedDate) {
      console.log('Selected date:', selectedDate);
      // ここで選択された日付に基づいて何か処理を行う
    }
  }, [selectedDate]);

  const handleNextStep = () => {
    setCurrentStep(prevStep => prevStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prevStep => Math.max(1, prevStep - 1));
  };

  const containerStyle = {
    transform: 'scale(1.1)',
    transformOrigin: 'center top',
    width: '90.91%', // 100 / 1.1
    margin: '0 auto',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 overflow-x-hidden">
      <main className="flex-grow container mx-auto px-3 py-18 sm:px-4 sm:py-20 max-w-6xl" style={containerStyle}>
        <div className="space-y-6">
          <ReservationProcess 
            currentStep={currentStep} 
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
          />
          
          <div className="flex justify-center mb-6">
            <div className="inline-block border-2 border-[#00A2EF] px-11 py-1 bg-[#00A2EF]">
              <h2 className="text-xl font-black text-[#FFFFFF]">
                ＼　ご希望の宿泊日をお選びください　／
              </h2>
            </div>
          </div>

          <RoomInformation />
          <ReservationCalendar onDateSelect={handleDateSelect} />
        </div>
      </main>
    </div>
  );
}