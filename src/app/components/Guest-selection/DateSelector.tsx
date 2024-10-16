'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useReservation } from '@/app/contexts/ReservationContext';
import CustomDatePicker from './CustomDatePicker';

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
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  setSelectedDate,
  nights,
  setNights,
  units,
  setUnits,
  guestCounts,
  setGuestCounts
}) => {
  const { dispatch } = useReservation();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

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

  const handleGuestCountChange = (unitIndex: number, guestType: keyof GuestCounts, value: number) => {
    const newGuestCounts = [...guestCounts];
    if (!newGuestCounts[unitIndex]) {
      newGuestCounts[unitIndex] = { male: 0, female: 0, childWithBed: 0, childNoBed: 0 };
    }
    newGuestCounts[unitIndex] = { ...newGuestCounts[unitIndex], [guestType]: Math.max(0, value) };
    setGuestCounts(newGuestCounts);
    dispatch({ type: 'SET_GUEST_COUNTS', payload: newGuestCounts });
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      dispatch({ type: 'SET_DATE', payload: date });
      setIsCalendarOpen(false);
    }
  };

  const formatDate = (date: Date): string => {
    console.log('Formatting Date:', date);
  
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 既に1が加算されていることを確認
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  
    console.log('Formatted Date:', `${year}.${month}.${day}`);
  
    return `${toFullWidth(year)}．${toFullWidth(month, 2)}．${toFullWidth(day, 2)}（${dayOfWeek}）`;
  };
  const toFullWidth = (num: number, padding: number = 0): string => {
    const paddedNum = num.toString().padStart(padding, '0');
    return paddedNum.split('').map((char) => String.fromCharCode(char.charCodeAt(0) + 0xFEE0)).join('');
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
                onChange={(date: Date | null) => {
                  if (date) {
                    setSelectedDate(date);
                    dispatch({ type: 'SET_DATE', payload: date });
                    setIsCalendarOpen(false);
                  }
                }}
                minDate={new Date()}
              />
            </div>
          )}
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold">泊数</span>
              <div className="bg-gray-100 px-2 py-1 rounded-lg flex items-center h-14">
                <span className="text-lg font-semibold mr-2">{toFullWidth(nights)}泊</span>
                <div className="flex flex-col ml-1">
                  <button onClick={() => {
                    const newNights = nights + 1;
                    setNights(newNights);
                    dispatch({ type: 'SET_NIGHTS', payload: newNights });
                  }} className="p-0.5">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => {
                    const newNights = Math.max(1, nights - 1);
                    setNights(newNights);
                    dispatch({ type: 'SET_NIGHTS', payload: newNights });
                  }} className="p-0.5">
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
                  <button onClick={() => {
                    const newUnits = Math.min(2, units + 1);
                    setUnits(newUnits);
                    dispatch({ type: 'SET_UNITS', payload: newUnits });
                  }} className="p-0.5">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => {
                    const newUnits = Math.max(1, units - 1);
                    setUnits(newUnits);
                    dispatch({ type: 'SET_UNITS', payload: newUnits });
                  }} className="p-0.5">
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {[...Array(units)].map((_, index) => (
        <div key={index} className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
            <div className="flex flex-col mr-0 sm:mr-4 mt-4 mb-2 sm:mb-0">
              <h3 className="text-base font-semibold">ご利用人数 ({toFullWidth(index + 1)}棟目)</h3>
              <span className="text-xs">※棟の定員：２〜５名様</span>
            </div>
            <div className="bg-gray-100 p-4 sm:p-6 rounded-lg flex-grow w-full">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
                {['male', 'female', 'childWithBed', 'childNoBed'].map((key, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-xs font-bold mb-2 sm:mb-4 text-center">
                      {key === 'male' ? '男性' : key === 'female' ? '女性' : key === 'childWithBed' ? '小学生以下（寝具あり）' : '小学生以下（添い寝）'}
                    </span>
                    <div className="flex items-center bg-white rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleGuestCountChange(index, key as keyof GuestCounts, (guestCounts[index]?.[key as keyof GuestCounts] || 0) - 1)}
                        className="p-2 border-r border-gray-200"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <input
                        type="text"
                        value={toFullWidth(guestCounts[index]?.[key as keyof GuestCounts] || 0)}
                        onChange={(e) => {
                          const halfWidthValue = e.target.value.replace(/[０-９]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xFEE0));
                          handleGuestCountChange(index, key as keyof GuestCounts, parseInt(halfWidthValue) || 0);
                        }}
                        className="w-8 text-center py-2 text-sm font-bold"
                      />
                      <button
                        onClick={() => handleGuestCountChange(index, key as keyof GuestCounts, (guestCounts[index]?.[key as keyof GuestCounts] || 0) + 1)}
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