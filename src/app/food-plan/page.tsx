'use client';

import { useState } from 'react';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import FoodPlanSelection from '@/app/components/food-plan/FoodPlanSelection';
import ReservationConfirmation from '@/app/components/reservation/ReservationConfirmation';

export default function FoodPlanPage() {
  const [currentStep, setCurrentStep] = useState(3);
  const [selectedPlans, setSelectedPlans] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);

  const handleNextStep = () => {
    setCurrentStep(prevStep => prevStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prevStep => Math.max(1, prevStep - 1));
  };

  const handlePlanSelection = (plans: { [key: string]: number }, price: number) => {
    setSelectedPlans(plans);
    setTotalPrice(price);
  };

  return (
    <div className="bg-gray-100 overflow-x-hidden">
      <main className="container mx-auto px-3 py-8 sm:px-4 sm:py-12 max-w-6xl">
        <div className="space-y-6">
          <ReservationProcess 
            currentStep={currentStep} 
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
          />
          
          <div className="flex justify-center mb-6">
            <div className="inline-block border-2 border-[#00A2EF] px-11 py-1 bg-[#00A2EF]">
              <h2 className="text-xl font-black text-[#FFFFFF]">
                ＼　食事プランをお選びください　／
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <FoodPlanSelection onPlanSelection={handlePlanSelection} />
            
            {Object.keys(selectedPlans).length > 0 && (
              <>
                <div className="my-8 border-t border-gray-300"></div>
                <ReservationConfirmation selectedPlans={selectedPlans} totalPrice={totalPrice} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}