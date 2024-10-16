'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// 予約者情報の型定義
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

// ゲストの人数情報
export interface GuestCount {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

// 食事プランの選択情報
export interface FoodPlanSelection {
  count: number;
  menuSelections?: { [category: string]: { [item: string]: number } };
}

// 予約の状態
export interface ReservationState {
  selectedDate: Date | null;
  nights: number;
  units: number;
  guestCounts: GuestCount[];
  selectedFoodPlans: { [key: string]: FoodPlanSelection };
  selectedFoodPlansByDate: { [date: string]: { [key: string]: number } };
  totalPrice: number;
  selectedPrice: number;
  totalMealPrice: number;
  personalInfo?: PersonalInfoFormData;
  paymentMethod: 'credit' | 'onsite';
  checkInDate?: string;
}

// アクションタイプの定義
type ReservationAction =
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'SET_NIGHTS'; payload: number }
  | { type: 'SET_UNITS'; payload: number }
  | { type: 'SET_GUEST_COUNTS'; payload: ReservationState['guestCounts'] }
  | { type: 'SET_FOOD_PLANS'; payload: ReservationState['selectedFoodPlans'] }
  | { type: 'SET_FOOD_PLANS_BY_DATE'; payload: ReservationState['selectedFoodPlansByDate'] }
  | { type: 'SET_TOTAL_PRICE'; payload: number }
  | { type: 'SET_TOTAL_MEAL_PRICE'; payload: number }
  | { type: 'SET_PERSONAL_INFO'; payload: PersonalInfoFormData }
  | { type: 'SET_SELECTED_PRICE'; payload: number }
  | { type: 'SET_PAYMENT_METHOD'; payload: 'credit' | 'onsite' }
  | { type: 'SET_CHECK_IN_DATE'; payload: string };

// 初期状態の定義
const initialState: ReservationState = {
  selectedDate: null,
  nights: 1,
  units: 1,
  guestCounts: [{ male: 0, female: 0, childWithBed: 0, childNoBed: 0 }],
  selectedFoodPlans: {},
  selectedFoodPlansByDate: {},
  totalPrice: 0,
  totalMealPrice: 0,
  selectedPrice: 0,
  personalInfo: undefined,
  paymentMethod: 'onsite',
};

// コンテキストの作成
const ReservationContext = createContext<{
  state: ReservationState;
  dispatch: React.Dispatch<ReservationAction>;
} | undefined>(undefined);

// リデューサーの定義
const reservationReducer = (state: ReservationState, action: ReservationAction): ReservationState => {
  switch (action.type) {
    case 'SET_DATE':
      console.log('Setting Date in Context:', action.payload);
      return { ...state, selectedDate: action.payload };
    case 'SET_NIGHTS':
      return { ...state, nights: action.payload };
    case 'SET_UNITS':
      return { ...state, units: action.payload };
    case 'SET_GUEST_COUNTS':
      return { ...state, guestCounts: action.payload };
    case 'SET_FOOD_PLANS':
      return { ...state, selectedFoodPlans: action.payload };
    case 'SET_FOOD_PLANS_BY_DATE':
      return { ...state, selectedFoodPlansByDate: action.payload };
    case 'SET_TOTAL_PRICE':
      return { ...state, totalPrice: action.payload };
    case 'SET_TOTAL_MEAL_PRICE':
      return { ...state, totalMealPrice: action.payload };
    case 'SET_PERSONAL_INFO':
      return { ...state, personalInfo: action.payload };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'SET_SELECTED_PRICE':
      return { ...state, selectedPrice: action.payload };
    case 'SET_CHECK_IN_DATE':
      return { ...state, checkInDate: action.payload };
    default:
      return state;
  }
};

// プロバイダーコンポーネントの作成
export const ReservationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reservationReducer, initialState);

  return (
    <ReservationContext.Provider value={{ state, dispatch }}>
      {children}
    </ReservationContext.Provider>
  );
};

// カスタムフックの作成
export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};