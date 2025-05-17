// src/app/components/Guest-selection/DateSelector.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useReservation } from '@/app/contexts/ReservationContext';
import CustomDatePicker from './CustomDatePicker';
import { format, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';

interface GuestCounts {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

interface DateSelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  nights: number;
  setNights: (nights: number) => void;
  units: number;
  setUnits: (units: number) => void;
  guestCounts: GuestCounts[];
  setGuestCounts: (guestCounts: GuestCounts[]) => void;
  availableDates: { [date: string]: { totalReserved: number; available: number } };
  maxNights: number;
  warning: string | null;
  setWarning: React.Dispatch<React.SetStateAction<string | null>>;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  setSelectedDate,
  nights,
  setNights,
  units,
  setUnits,
  guestCounts,
  setGuestCounts,
  availableDates,
  maxNights,
  warning,
  setWarning,
}) => {
  const { dispatch } = useReservation();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const { state } = useReservation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleGuestCountChange = (
    unitIndex: number,
    guestType: keyof GuestCounts,
    value: number
  ) => {
    const newGuestCounts = [...guestCounts];
    if (!newGuestCounts[unitIndex]) {
      newGuestCounts[unitIndex] = { male: 0, female: 0, childWithBed: 0, childNoBed: 0 };
    }
    newGuestCounts[unitIndex] = {
      ...newGuestCounts[unitIndex],
      [guestType]: Math.max(0, value),
    };
    setGuestCounts(newGuestCounts);
    dispatch({ type: 'SET_GUEST_COUNTS', payload: newGuestCounts });
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      dispatch({ type: 'SET_DATE', payload: date });
      setIsCalendarOpen(false);
      // 日付が変更されたら泊数を1にリセット
      setNights(1);
      dispatch({ type: 'SET_NIGHTS', payload: 1 });
    }
  };

  const formatDate = (date: Date): string => {
    return format(date, "yyyy'年'MM'月'dd'日'（E）", { locale: ja });
  };

  const toFullWidth = (num: number, padding: number = 0): string => {
    const paddedNum = num.toString().padStart(padding, '0');
    return paddedNum
      .split('')
      .map((char) => String.fromCharCode(char.charCodeAt(0) + 0xFEE0))
      .join('');
  };

  const isBlackoutDate = (date: Date): boolean => {
    const month = date.getMonth(); // 0=Jan
    if (month === 7) return true; // August
    if (month !== 7 && date.getDay() === 6) return true; // Saturday outside August
    return false;
  };

  const isDateAvailable = (date: Date): boolean => {
    const dateString = format(date, 'yyyy-MM-dd');
    // 空室データ未取得時はすべて選択不可
    if (Object.keys(availableDates).length === 0) return false;

    // ブラックアウト日は予約不可
    if (isBlackoutDate(date)) return false;

    const availableInfo = availableDates[dateString];
    // availableInfo が存在しない場合は空き2棟とみなすルールだが、ブラックアウト優先
    return !availableInfo || availableInfo.available > 0;
  };

  const handleNightsChange = (newNights: number) => {
    const newNightsClamped = Math.max(1, Math.min(newNights, maxNights));
  
    let canStay = true;
    for (let i = 0; i < newNightsClamped; i++) {
      const date = addDays(selectedDate, i);
      const dateString = format(date, 'yyyy-MM-dd');
      const availableInfo = availableDates[dateString];
      const availableUnits = isBlackoutDate(date) ? 0 : (availableDates[dateString]?.available ?? 2);
  
      if (availableUnits < units) {
        canStay = false;
        break;
      }
    }
  
    if (!canStay) {
      setWarning('選択した期間のいずれかの日で、希望する棟数の空きがありません。連泊はできません。');
    } else {
      setWarning(null);
      setNights(newNightsClamped);
      dispatch({ type: 'SET_NIGHTS', payload: newNightsClamped });
    }
  };

  const handleUnitsChange = (newUnits: number) => {
    const newUnitsClamped = Math.max(1, Math.min(newUnits, 2));
  
    let canStay = true;
    for (let i = 0; i < nights; i++) {
      const date = addDays(selectedDate, i);
      const dateString = format(date, 'yyyy-MM-dd');
      const availableInfo = availableDates[dateString];
      const availableUnits = isBlackoutDate(date) ? 0 : (availableDates[dateString]?.available ?? 2);
  
      if (availableUnits < newUnitsClamped) {
        canStay = false;
        break;
      }
    }
  
    if (!canStay) {
      setWarning('選択した期間のいずれかの日で、希望する棟数の空きがありません。');
    } else {
      setWarning(null);
      setUnits(newUnitsClamped);
      dispatch({ type: 'SET_UNITS', payload: newUnitsClamped });
  
      // 棟数が変わったら guestCounts の配列を調整
      const newGuestCounts = [...guestCounts];
      if (newUnitsClamped > guestCounts.length) {
        for (let i = guestCounts.length; i < newUnitsClamped; i++) {
          newGuestCounts.push({ male: 0, female: 0, childWithBed: 0, childNoBed: 0 });
        }
      } else {
        newGuestCounts.length = newUnitsClamped;
      }
      setGuestCounts(newGuestCounts);
      dispatch({ type: 'SET_GUEST_COUNTS', payload: newGuestCounts });
    }
  };

  return (
    <div className="text-[#000000] max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 text-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 flex-grow w-full sm:w-auto">
          <span className="font-extrabold text-base whitespace-nowrap">宿泊日</span>
          <div className="flex items-center justify-between bg-gray-100 px-4 py-1 rounded-lg h-14 w-full sm:w-auto">
            <span className="text-base sm:text-lg font-semibold">
              {formatDate(selectedDate)}
            </span>
            <button
              className="ml-1 px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            >
              宿泊日の変更
            </button>
          </div>
          {isCalendarOpen && (
            <div ref={calendarRef} className="absolute z-10 mt-1 bg-white shadow-lg rounded-lg p-4">
              <CustomDatePicker
                selectedDate={selectedDate}
                onChange={handleDateChange}
                minDate={state.bookingStartDate}
                maxDate={state.bookingEndDate}
                filterDate={isDateAvailable}
              />
            </div>
          )}
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold">泊数</span>
              <div className="bg-gray-100 px-2 py-1 rounded-lg flex items-center h-14">
                <span className="text-lg font-semibold mr-2">{toFullWidth(nights)}泊</span>
                <div className="flex flex-col ml-1">
                  <button
                    onClick={() => handleNightsChange(nights + 1)}
                    className="p-0.5"
                    disabled={nights >= maxNights}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => handleNightsChange(nights - 1)}
                    className="p-0.5"
                    disabled={nights <= 1}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold">棟数</span>
              <div className="bg-gray-100 px-2 py-1 rounded-lg flex items-center h-14">
                <span className="text-lg font-semibold mr-2">{toFullWidth(units)}棟</span>
                <div className="flex flex-col ml-1">
                  <button
                    onClick={() => handleUnitsChange(units + 1)}
                    className="p-0.5"
                    disabled={units >= 2}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => handleUnitsChange(units - 1)}
                    className="p-0.5"
                    disabled={units <= 1}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {warning && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">{warning}</div>
      )}

{[...Array(units)].map((_, index) => (
  <div key={index} className="mb-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
      <div className="w-full sm:w-1/4 mr-4">
        <h3 className="text-base font-semibold">ご利用人数（{toFullWidth(index + 1)}棟目）</h3>
        <span className="text-xs mt-1">※棟の定員：1〜５名様</span>
      </div>
      <div className="bg-gray-100 p-4 sm:p-6 rounded-lg flex-grow w-full sm:w-3/4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
          {['male', 'female', 'childWithBed', 'childNoBed'].map((key, i) => (
            <div key={i} className="flex flex-col items-center">
                    <span className="text-xs font-bold mb-2 sm:mb-4 text-center truncate w-full">
                      {key === 'male'
                        ? '男性'
                        : key === 'female'
                        ? '女性'
                        : key === 'childWithBed'
                        ? '小学生以下（寝具あり）'
                        : '小学生以下（添い寝）'}
                    </span>
                    <div className="flex items-center bg-white rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          handleGuestCountChange(
                            index,
                            key as keyof GuestCounts,
                            (guestCounts[index]?.[key as keyof GuestCounts] || 0) - 1
                          )
                        }
                        className="p-2 border-r border-gray-200"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <input
                        type="text"
                        value={toFullWidth(guestCounts[index]?.[key as keyof GuestCounts] || 0)}
                        onChange={(e) => {
                          const halfWidthValue = e.target.value.replace(
                            /[０-９]/g,
                            (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
                          );
                          handleGuestCountChange(
                            index,
                            key as keyof GuestCounts,
                            parseInt(halfWidthValue) || 0
                          );
                        }}
                        className="w-8 text-center py-2 text-sm font-bold"
                      />
                      <button
                        onClick={() =>
                          handleGuestCountChange(
                            index,
                            key as keyof GuestCounts,
                            (guestCounts[index]?.[key as keyof GuestCounts] || 0) + 1
                          )
                        }
                        className="p-2 border-l border-gray-200 font-bold"
                      >
                        <ChevronUp size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DateSelector;
