// src/app/contexts/ReservationContext.tsx

'use client';

import React, { createContext, useContext, useReducer, Dispatch } from 'react';
import { 
  FoodPlanInfo, 
  DatePlans, 
  UnitPlans, 
  SelectedFoodPlanByUnit, 
  SelectedFoodPlanByDate, 
  MenuSelectionsByDate, 
  PersonalInfoFormData 
} from '@/app/types/ReservationTypes';

// ゲスト数のインターフェース
interface GuestCounts {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

// 予約状態のインターフェース
interface ReservationState {
  selectedDate: Date | null;
  nights: number;
  units: number;
  guestCounts: GuestCounts[];
  totalGuests: number;
  totalPrice: number;
  selectedPrice: number;
  selectedFoodPlans: {
    [planId: string]: {
      count: number;
      menuSelections?: {
        [category: string]: {
          [item: string]: number;
        };
      };
    };
  };
  selectedFoodPlansByDate: SelectedFoodPlanByDate;
  totalMealPrice: number;
  personalInfo: PersonalInfoFormData | null;
  bookingStartDate: Date;
  bookingEndDate: Date;
  dailyRates: {
    date: Date;
    price: number;
    mealPlans?: {
      name: string;
      count: number;
      price: number;
      menuSelections: {
        [category: string]: {
          [item: string]: number;
        };
      } | null;
    }[];
  }[];
  discountAmount: number;
  menuSelectionsByDate: MenuSelectionsByDate;
  selectedFoodPlansByUnit: SelectedFoodPlanByUnit;
}

// 予約アクションのタイプ定義
type ReservationAction =
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'SET_NIGHTS'; payload: number }
  | { type: 'SET_UNITS'; payload: number }
  | { type: 'SET_GUEST_COUNTS'; payload: GuestCounts[] }
  | { type: 'SET_TOTAL_GUESTS'; payload: number }
  | { type: 'SET_TOTAL_PRICE'; payload: number }
  | { type: 'SET_SELECTED_PRICE'; payload: number }
  | { type: 'SET_FOOD_PLANS'; payload: ReservationState['selectedFoodPlans'] }
  | { type: 'SET_FOOD_PLANS_BY_DATE'; payload: SelectedFoodPlanByDate }
  | { type: 'SET_TOTAL_MEAL_PRICE'; payload: number }
  | { type: 'SET_PERSONAL_INFO'; payload: PersonalInfoFormData }
  | { type: 'SET_BOOKING_PERIOD'; payload: { start: Date; end: Date } }
  | { type: 'SET_DAILY_RATES'; payload: ReservationState['dailyRates'] }
  | { type: 'SET_DISCOUNT_AMOUNT'; payload: number }
  | { type: 'SET_MENU_SELECTIONS_BY_DATE'; payload: MenuSelectionsByDate }
  | { type: 'SET_FOOD_PLANS_BY_UNIT'; payload: SelectedFoodPlanByUnit };

// 初期状態
const initialState: ReservationState = {
  selectedDate: null,
  nights: 1,
  units: 1,
  guestCounts: [],
  totalGuests: 0,
  totalPrice: 0,
  selectedPrice: 0,
  selectedFoodPlans: {},
  selectedFoodPlansByDate: {},
  totalMealPrice: 0,
  personalInfo: null,
  bookingStartDate: new Date(),
  bookingEndDate: new Date(new Date().getFullYear() + 1, 4, 31),
  dailyRates: [],
  discountAmount: 0,
  menuSelectionsByDate: {},
  selectedFoodPlansByUnit: {},
};

// コンテキストの作成
const ReservationContext = createContext<{
  state: ReservationState;
  dispatch: Dispatch<ReservationAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

// リデューサー関数
const reservationReducer = (
  state: ReservationState,
  action: ReservationAction
): ReservationState => {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, selectedDate: action.payload };

    case 'SET_NIGHTS':
      return { ...state, nights: action.payload };

    case 'SET_UNITS':
      return { ...state, units: action.payload };

    case 'SET_GUEST_COUNTS':
      const totalGuests = action.payload.reduce(
        (total, guestCount) =>
          total +
          guestCount.male +
          guestCount.female +
          guestCount.childWithBed +
          guestCount.childNoBed,
        0
      );
      return { ...state, guestCounts: action.payload, totalGuests };

    case 'SET_TOTAL_GUESTS':
      return { ...state, totalGuests: action.payload };

    case 'SET_TOTAL_PRICE':
      return { ...state, totalPrice: action.payload };

    case 'SET_SELECTED_PRICE':
      return { ...state, selectedPrice: action.payload };

    case 'SET_FOOD_PLANS':
      return { ...state, selectedFoodPlans: action.payload };

    case 'SET_FOOD_PLANS_BY_DATE':
      return { ...state, selectedFoodPlansByDate: action.payload };

    case 'SET_TOTAL_MEAL_PRICE':
      return { ...state, totalMealPrice: action.payload };

    case 'SET_PERSONAL_INFO':
      return { ...state, personalInfo: action.payload };

    case 'SET_BOOKING_PERIOD':
      return {
        ...state,
        bookingStartDate: action.payload.start,
        bookingEndDate: action.payload.end,
      };

    case 'SET_DAILY_RATES':
      return { ...state, dailyRates: action.payload };

    case 'SET_DISCOUNT_AMOUNT':
      return { ...state, discountAmount: action.payload };

    case 'SET_MENU_SELECTIONS_BY_DATE':
      return { ...state, menuSelectionsByDate: action.payload };

    case 'SET_FOOD_PLANS_BY_UNIT':
      return { ...state, selectedFoodPlansByUnit: action.payload };

    default:
      return state;
  }
};

// プロバイダーコンポーネント
export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reservationReducer, initialState);

  return (
    <ReservationContext.Provider value={{ state, dispatch }}>
      {children}
    </ReservationContext.Provider>
  );
};

// カスタムフック
export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error(
      'useReservation は ReservationProvider の内部で使用する必要があります'
    );
  }
  return context;
};
