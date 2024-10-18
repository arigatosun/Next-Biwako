// src/app/types/food-plan.ts

export interface FoodPlan {
  id: string;
  name: string;
  price: number;
  images?: string[];
  menuItems?: {
    [category: string]: string[];
  };
}