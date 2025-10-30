// src/app/data/foodPlans.ts

export interface FoodPlan {
    id: string;
    name: string;
    price: number;
    images?: string[];
    menuItems?: {
      [category: string]: string[];
    };
  }
  
  export const foodPlans: FoodPlan[] = [
    { id: 'no-meal', name: '食事なし', price: 0 },
    {
      id: 'plan-a',
      name: 'plan.A 贅沢素材のディナーセット',
      price: 6500,
      images: [
        '/images/plan-a/2025.webp',
        '/images/plan-a/2026.webp',
        '/images/plan-a/2027.webp',
        '/images/plan-a/2028.webp',
        '/images/plan-a/2029.webp',
        '/images/plan-a/2030.webp',
      ],
      menuItems: {
        主菜: ['サーロインステーキ…150g', '淡路牛…150g'],
        副菜: [
          'ビワマスのアヒージョ',
          'チキンのアヒージョ',
          'つぶ貝のアヒージョ',
        ],
        主食: ['上海風焼きそば', 'ガーリックライス', 'チャーハン'],
      },
    },
    {
      id: 'plan-b',
      name: 'plan.B お肉づくし！豪華BBQセット',
      price: 6500,
      images: [
        '/images/plan-b/2031.webp',
        '/images/plan-b/2032.webp',
        '/images/plan-b/2033.webp',
      ],
      menuItems: {
        ステーキ: ['牛フィレステーキ…100g', 'サーロインステーキ…100g'],
      },
    },
    {
      id: 'plan-c',
      name: '大満足！よくばりお子さまセット',
      price: 3000,
      images: ['/images/plan-c/2034.webp', '/images/plan-c/2035.webp'],
    },
  ];