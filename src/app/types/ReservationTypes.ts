// src/app/types/ReservationTypes.ts

export interface GuestCounts {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

// 以下は既存のインターフェース
export interface FoodPlanInfo {
  count: number;
  price: number;
  menuSelections?: {
    [category: string]: {
      [item: string]: number;
    };
  };
}

export interface DatePlans {
  [planId: string]: FoodPlanInfo;
}

export interface UnitPlans {
  [date: string]: DatePlans;
}

export interface SelectedFoodPlanByUnit {
  [unitIndex: string]: UnitPlans;
}

export interface SelectedFoodPlanByDate {
  [date: string]: DatePlans;
}

export interface MenuSelectionsByDate {
  [date: string]: {
    [planId: string]: {
      [category: string]: {
        [item: string]: number;
      };
    };
  };
}

export interface PersonalInfoFormData {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  emailConfirm: string;
  gender: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  address: string;
  buildingName?: string;
  transportation: string;
  checkInTime: string;
  pastStay: string;
  notes?: string;
  purpose: string;
  purposeDetails?: string;
}
