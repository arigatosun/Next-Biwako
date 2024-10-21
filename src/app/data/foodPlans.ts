// src/app/data/foodPlans.ts
export interface FoodPlan {
    id: string;
    name: string;
    price: number;
    // 他のプロパティ...
  }
  
  export const foodPlans: FoodPlan[] = [
    {
      id: 'plan-a',
      name: 'plan.A 贅沢素材のディナーセット',
      price: 6500,
      // 他のプロパティ...
    },
    {
      id: 'plan-b',
      name: 'plan.B お肉づくし！豪華BBQセット',
      price: 6500,
      // 他のプロパティ...
    },
    {
      id: 'plan-c',
      name: '大満足！よくばりお子さまセット',
      price: 3000,
      // 他のプロパティ...
    },
    // 他のプラン...
  ];
  