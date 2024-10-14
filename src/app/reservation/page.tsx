'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import RoomInformation from '@/app/components/reservation/RoomInformation';
import ReservationCalendar from '@/app/components/reservation/ReservationCalendar';

export default function ReservationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setTimeout(() => {
      router.push(`/guest-selection`);
    }, 0);
  };

  const handleStepClick = (step: number) => {
    switch (step) {
      case 2:
        router.push('/guest-selection');
        break;
      case 3:
        router.push('/food-plan');
        break;
      case 4:
        router.push('/reservation-form');
        break;
      // Add other cases as needed
      default:
        // Optional: Handle invalid step
        break;
    }
  };

  useEffect(() => {
    if (selectedDate) {
      console.log('Selected date:', selectedDate);
    }
  }, [selectedDate]);

  const containerStyle = {
    transform: 'scale(1.1)',
    transformOrigin: 'center top',
    width: '90.91%',
    margin: '0 auto',
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col bg-gray-100 overflow-x-hidden">
        <div className="flex-grow container mx-auto px-3 py-18 sm:px-4 sm:py-20 max-w-6xl" style={containerStyle}>
          <div className="space-y-6">
            <ReservationProcess 
              currentStep={currentStep}
              onStepClick={handleStepClick}
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
        </div>
      </div>
    </Layout>
  );
}