import React from 'react';

type Step = {
  number: number;
  text: string;
};

const steps: Step[] = [
  { number: 1, text: '宿泊日選択' },
  { number: 2, text: '予約人数選択' },
  { number: 3, text: '食事プラン選択' },
  { number: 4, text: '予約内容確認' },
  { number: 5, text: '個人情報入力' },
  { number: 6, text: '予約完了' },
];

const getNumberSymbol = (num: number): string => {
  const symbols = ['❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾', '❿'];
  return symbols[num - 1] || num.toString();
};

interface ReservationProcessProps {
  currentStep: number;
  onNextStep: () => void;
  onPrevStep: () => void;
}

const ReservationProcess: React.FC<ReservationProcessProps> = ({ currentStep, onNextStep, onPrevStep }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-3 sm:px-0 text-base" role="navigation" aria-label="予約プロセス">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex items-center mb-2 sm:mb-0">
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
                step.number === currentStep ? 'text-[#00A2EF] font-bold' : 'text-gray-500'
              }`}
            >
              {step.text}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="hidden sm:block text-gray-300 mx-1" aria-hidden="true">
              ▶︎
            </div>
          )}
        </React.Fragment>
      ))}
      <div className="mt-4 sm:mt-0">
        <button onClick={onPrevStep} disabled={currentStep === 1} className="mr-2 px-3 py-1.5 bg-gray-200 rounded text-base">
          戻る
        </button>
        <button onClick={onNextStep} disabled={currentStep === steps.length} className="px-3 py-1.5 bg-blue-500 text-white rounded text-base">
          次へ
        </button>
      </div>
    </div>
  );
};

export default ReservationProcess;