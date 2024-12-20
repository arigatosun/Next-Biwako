import React, { useCallback } from 'react';

interface CounterButtonProps {
  count: number;
  onCountChange: (change: number) => void;
  max?: number;
}

const CounterButton: React.FC<CounterButtonProps> = ({ count, onCountChange, max }) => {
  console.log(`CounterButton - Count: ${count}, Max: ${max}`);

  const handleIncrement = () => {
    if (max === undefined || count < max) {
      console.log('Increment button clicked');
      onCountChange(1);
    }
  };
  
  const handleDecrement = () => {
    if (count > 0) {
      console.log('Decrement button clicked');
      onCountChange(-1);
    }
  };  

  return (
    <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
      <button
        onClick={handleDecrement}
        disabled={count <= 0}
        className="px-3 py-1 bg-[#00A2EF] text-white font-bold text-lg hover:bg-[#0081BF] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        -
      </button>
      <span className="px-3 py-1 bg-white text-[#363331] font-semibold">{count}</span>
      <button
        onClick={handleIncrement}
        disabled={max !== undefined && count >= max}
        className="px-3 py-1 bg-[#00A2EF] text-white font-bold text-lg hover:bg-[#0081BF] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  );
};

export default CounterButton;
