'use client';

import React from 'react';
import CounterButton from './CounterButton';

interface MenuSelectionProps {
  menuItems: { [key: string]: string[] };
  selections: { [category: string]: { [item: string]: number } };
  onSelection: (category: string, item: string, count: number) => void;
  maxCount: number;
}

export default function MenuSelection({ menuItems, selections, onSelection, maxCount }: MenuSelectionProps) {
  return (
    <div className="mt-4">
      {Object.entries(menuItems).map(([category, items]) => (
        <div key={category} className="mb-4">
          <h4 className="font-semibold mb-2 bg-blue-100 p-2 rounded">一人1種ずつお選びください</h4>
          {items.map((item) => (
            <div key={item} className="flex justify-between items-center mb-2">
              <span>{item}</span>
              <CounterButton
                count={selections[category]?.[item] || 0}
                onCountChange={(change) => {
                  const newCount = Math.max(0, (selections[category]?.[item] || 0) + change);
                  const totalSelected = Object.values(selections[category] || {}).reduce((sum, count) => sum + count, 0) - (selections[category]?.[item] || 0) + newCount;
                  if (totalSelected <= maxCount) {
                    onSelection(category, item, newCount);
                  }
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}