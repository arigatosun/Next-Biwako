'use client';

import { useState } from 'react';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import RoomInformation from '@/app/components/reservation/RoomInformation';
import ReservationCalendar from '@/app/components/reservation/ReservationCalendar';

export default function ReservationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentStep(2); // 日付選択後、次のステップへ
  };

  const handleNextStep = () => {
    setCurrentStep(prevStep => prevStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prevStep => Math.max(1, prevStep - 1));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <main className="flex-grow container mx-auto px-3 py-16 sm:px-4 sm:py-20 max-w-6xl"> {/* コンテナサイズとパディングを調整 */}
        <div className="space-y-6"> {/* コンポーネント間の間隔を調整 */}
          <ReservationProcess 
            currentStep={currentStep} 
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
          />
          
          <div className="flex justify-center mb-6">
            <div className="inline-block border-2 border-[#00A2EF] px-10 py-1 bg-[#00A2EF]"> {/* パディングを調整 */}
              <h2 className="text-xl font-black text-[#FFFFFF]"> {/* フォントサイズを調整 */}
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