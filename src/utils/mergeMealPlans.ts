// src/app/utils/mergeMealPlans.ts

interface SelectedFoodPlansByDate {
    [date: string]: {
      [planId: string]: {
        count: number;
        price: number;
      };
    };
  }
  
  interface MenuSelectionsByDate {
    [date: string]: {
      [planId: string]: {
        [category: string]: {
          [item: string]: number;
        };
      };
    };
  }
  
  interface MergedMealPlans {
    [date: string]: {
      [planId: string]: {
        count: number;
        price: number;
        menuSelections: {
          [category: string]: {
            [item: string]: number;
          };
        };
      };
    };
  }
  
  export function mergeMealPlansAndMenuSelections(
    selectedFoodPlansByDate: SelectedFoodPlansByDate,
    menuSelectionsByDate: MenuSelectionsByDate
  ): MergedMealPlans {
    const merged: MergedMealPlans = {};
  
    for (const date in selectedFoodPlansByDate) {
      merged[date] = {};
      for (const planId in selectedFoodPlansByDate[date]) {
        merged[date][planId] = {
          ...selectedFoodPlansByDate[date][planId],
          menuSelections:
            menuSelectionsByDate[date]?.[planId] || {},
        };
      }
    }
  
    return merged;
  }
  