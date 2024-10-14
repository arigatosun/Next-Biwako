'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface GuestCount {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

export interface FoodPlanSelection {
  count: number;
  menuSelections?: { [category: string]: { [item: string]: number } };
}

export interface ReservationState {
  selectedDate: Date | null;
  nights: number;
  units: number;
  guestCounts: GuestCount[];
  selectedFoodPlans: { [planId: string]: FoodPlanSelection };
  totalPrice: number;
}

type ReservationAction =
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'SET_NIGHTS'; payload: number }
  | { type: 'SET_UNITS'; payload: number }
  | { type: 'SET_GUEST_COUNTS'; payload: ReservationState['guestCounts'] }
  | { type: 'SET_FOOD_PLANS'; payload: ReservationState['selectedFoodPlans'] }
  | { type: 'SET_TOTAL_PRICE'; payload: number };

const initialState: ReservationState = {
  selectedDate: null,
  nights: 1,
  units: 1,
  guestCounts: [{ male: 0, female: 0, childWithBed: 0, childNoBed: 0 }],
  selectedFoodPlans: {},
  totalPrice: 0,
};

const ReservationContext = createContext<{
  state: ReservationState;
  dispatch: React.Dispatch<ReservationAction>;
} | undefined>(undefined);

const reservationReducer = (state: ReservationState, action: ReservationAction): ReservationState => {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SET_NIGHTS':
      return { ...state, nights: action.payload };
    case 'SET_UNITS':
      return { ...state, units: action.payload };
    case 'SET_GUEST_COUNTS':
      return { ...state, guestCounts: action.payload };
    case 'SET_FOOD_PLANS':
      return { ...state, selectedFoodPlans: action.payload };
    case 'SET_TOTAL_PRICE':
      return { ...state, totalPrice: action.payload };
    default:
      return state;
  }
};

export const ReservationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reservationReducer, initialState);

  return (
    <ReservationContext.Provider value={{ state, dispatch }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};