import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface CounterButtonProps {
  count: number;
  onCountChange: (change: number) => void;
  max?: number;
}

export default function CounterButton({ count, onCountChange, max }: CounterButtonProps) {
  return (
    <div className="flex items-center bg-white rounded-lg overflow-hidden">
      <button 
        onClick={() => onCountChange(-1)} 
        className="p-1 border-r border-gray-200"
        disabled={count === 0}
      >
        <ChevronDown size={16} />
      </button>
      <span className="px-3">{count}</span>
      <button 
        onClick={() => onCountChange(1)} 
        className="p-1 border-l border-gray-200"
        disabled={max !== undefined && count >= max}
      >
        <ChevronUp size={16} />
      </button>
    </div>
  );
}