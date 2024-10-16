import React from 'react';

interface CounterButtonProps {
  count: number;
  onCountChange: (change: number) => void;
  max?: number;
}

const CounterButton: React.FC<CounterButtonProps> = ({ count, onCountChange, max }) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
      <button
        onClick={() => onCountChange(-1)}
        disabled={count === 0}
        className="px-3 py-1 bg-[#00A2EF] text-white font-bold text-lg hover:bg-[#0081BF] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        -
      </button>
      <span className="px-3 py-1 bg-white text-[#363331] font-semibold">{count}</span>
      <button
        onClick={() => onCountChange(1)}
        disabled={max !== undefined && count >= max}
        className="px-3 py-1 bg-[#00A2EF] text-white font-bold text-lg hover:bg-[#0081BF] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  );
};

export default CounterButton;