'use client';

import React, { useRef, useEffect, useState } from 'react';

type Step = {
  number: number;
  text: string;
};

const steps: Step[] = [
  { number: 1, text: '宿泊日選択' },
  { number: 2, text: '予約人数選択' },
  { number: 3, text: '食事プラン選択・予約内容確認' },
  { number: 4, text: '個人情報入力' },
  { number: 5, text: '予約完了' },
];

const getNumberSymbol = (num: number): string => {
  const symbols = ['❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾', '❿'];
  return symbols[num - 1] || num.toString();
};

interface ReservationProcessProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const ReservationProcess: React.FC<ReservationProcessProps> = ({ currentStep, onStepClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (scrollRef.current && !isMobile) {
      const currentStepElement = scrollRef.current.children[currentStep - 1] as HTMLElement;
      if (currentStepElement) {
        currentStepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentStep, isMobile]);

  const renderStep = (step: Step) => (
    <div 
      key={step.number}
      className={`flex items-center flex-shrink-0 cursor-pointer`}
      onClick={() => onStepClick && onStepClick(step.number)}
    >
      <span
        className={`mr-2 ${
          step.number === currentStep ? 'text-[#00A2EF]' : 'text-gray-400'
        }`}
        aria-hidden="true"
      >
        {getNumberSymbol(step.number)}
      </span>
      <span
        className={`${
          step.number === currentStep 
            ? 'text-[#00A2EF] font-bold border-b-2 border-[#00A2EF] pb-1' 
            : 'text-gray-500'
        }`}
        aria-current={step.number === currentStep ? 'step' : undefined}
      >
        {step.text}
      </span>
    </div>
  );

  return (
    <div className="mb-6 flex justify-center" role="navigation" aria-label="予約プロセス">
      {isMobile ? (
        <div className="flex justify-center">
          {renderStep(steps[currentStep - 1])}
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <div 
            ref={scrollRef}
            className="flex justify-center whitespace-nowrap pb-2 scrollbar-hide"
            aria-live="polite"
            aria-atomic="true"
          >
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                {renderStep(step)}
                {index < steps.length - 1 && (
                  <span className="text-gray-300 mx-8" aria-hidden="true">
                    ▶︎
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationProcess;