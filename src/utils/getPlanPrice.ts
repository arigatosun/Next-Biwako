// src/app/utils/getPlanPrice.ts
import { foodPlans } from '@/app/data/foodPlans';

export function getPlanPrice(planId: string): number | null {
  const plan = foodPlans.find((p) => p.id === planId);
  return plan ? plan.price : null;
}
