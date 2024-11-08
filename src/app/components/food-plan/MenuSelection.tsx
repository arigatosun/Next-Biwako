// MenuSelection.tsx

import React from 'react';
import CounterButton from './CounterButton';

interface MenuSelectionProps {
  menuItems: { [category: string]: string[] };
  selections?: { [category: string]: { [item: string]: number } };
  onSelection: (category: string, item: string, count: number) => void;
  totalGuests: number;
}

const MenuSelection: React.FC<MenuSelectionProps> = ({
  menuItems,
  selections = {},
  onSelection,
  totalGuests,
}) => {
  return (
    <div>
      {Object.entries(menuItems).map(([category, items]) => {
        const totalSelectedInCategory = Object.values(selections[category] || {}).reduce(
          (sum, count) => sum + count,
          0
        );

        return (
          <div key={category} className="mb-6">
            <h4 className="text-sm sm:text-base font-semibold mb-2">{category}</h4>
            <p
              className={`text-xs sm:text-sm mb-2 p-2 rounded ${
                totalSelectedInCategory < totalGuests
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-gray-600'
              }`}
            >
              一人1種ずつお選びください（{totalGuests}名分）
              <br />
              選択済み: {totalSelectedInCategory} / {totalGuests} 名分
            </p>
            {items.map((item) => {
              const itemCount = selections[category]?.[item] || 0;
              const remaining = totalGuests - (totalSelectedInCategory - itemCount);

              return (
                <div key={`${category}-${item}`} className="flex items-center justify-between mb-2">
                  <span className="text-sm sm:text-base mr-2">{item}</span>
                  <div className="flex-shrink-0">
                    <CounterButton
                      count={itemCount}
                      onCountChange={(change) => {
                        const newCount = itemCount + change;
                        if (newCount >= 0 && newCount <= totalGuests) {
                          onSelection(category, item, newCount);
                        }
                      }}
                      max={itemCount + remaining}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default MenuSelection;
