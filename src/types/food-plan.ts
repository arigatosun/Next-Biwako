export interface FoodPlan {
    id: string;
    name: string;
    price: number;
    images?: string[];
    menuItems?: { [key: string]: string[] };
  }