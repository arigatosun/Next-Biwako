// src/app/components/food-plan/MenuSelection.tsx

import React from 'react';
import CounterButton from './CounterButton';

interface MenuSelectionProps {
  menuItems: { [category: string]: string[] };
  selections: { [category: string]: { [item: string]: number } };
  onSelection: (category: string, item: string, count: number) => void;
  maxCount: number;
}

const MenuSelection: React.FC<MenuSelectionProps> = ({
  menuItems,
  selections,
  onSelection,
  maxCount,
}) => {
  return (
    <div>
      {Object.entries(menuItems).map(([category, items]) => {
        const totalSelectedInCategory = Object.values(selections[category] || {}).reduce(
          (sum, count) => sum + count,
          0
        );

        return (
          <div key={category}>
            <h4>{category}</h4>
            {items.map((item) => {
              const itemCount = selections[category]?.[item] || 0;
              const remaining = maxCount - (totalSelectedInCategory - itemCount);

              return (
                <div key={`${category}-${item}`} className="flex items-center justify-between mb-2">
                  <span>{item}</span>
                  <CounterButton
                    count={itemCount}
                    onCountChange={(change) => {
                      const currentItemCount = selections[category]?.[item] || 0;
                      const newCount = currentItemCount + change;
                      onSelection(category, item, newCount);
                    }}
                    max={remaining}
                  />
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
