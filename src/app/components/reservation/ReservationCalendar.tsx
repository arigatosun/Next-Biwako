// src/app/components/reservation/ReservationCalendar.tsx

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useReservation } from '@/app/contexts/ReservationContext';
import { getPriceForDate } from '@/app/data/roomPrices';

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

interface DayInfo {
  date: number;
  isCurrentMonth: boolean;
  isAvailable: boolean;
  price: number | null;
  reservedUnits: number;
  availableUnits: number;
}

interface ReservationCalendarProps {
  onDateSelect: (date: Date) => void;
  isMobile: boolean;
  currentStartDate: Date;
}

interface ReservationData {
  [date: string]: {
    total: number;
    available: number;
  };
}

const styles = {
  container: "bg-white p-3 sm:p-5 w-full max-w-6xl mx-auto",
  calendarGrid: "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-9",
  monthContainer: "border rounded-lg p-2 sm:p-4.5",
  monthTitle: "text-lg sm:text-xl font-bold mb-2 sm:mb-4.5 text-center",
  dayCell: "p-0 m-0 border border-transparent",
  dayCellInner: "w-full h-full flex items-center justify-center",
  innerFrame: "w-full h-full rounded-lg overflow-hidden flex items-center justify-center",
  dayContent: "w-full h-full flex flex-col justify-between p-1 sm:p-1.5",
  dayNumber: "text-xs sm:text-sm text-[#363331]",
  priceNumber: "text-sm sm:text-lg font-bold",
  priceText: "text-xs text-blue-500",
  unavailableMarker: "text-xl sm:text-2xl text-gray-400 flex items-center justify-center flex-1",
  bottomInfo: "mt-4 sm:mt-7 bg-[#999999] p-2 sm:p-3.5 rounded-lg",
  bottomInfoText: "flex flex-wrap items-center justify-center space-x-2 sm:space-x-5",
  bottomInfoItem: "text-white font-extrabold text-xs sm:text-sm",
  noticeText: "mt-2 sm:mt-3.5 text-xs sm:text-sm text-gray-600",
  dayOfWeek: "text-center p-1 text-xs sm:text-sm rounded-full bg-[#999999] text-white font-extrabold",
  availableUnits: "text-xs text-green-500",
};

export default function ReservationCalendar({ onDateSelect, isMobile, currentStartDate }: ReservationCalendarProps): React.ReactElement {
  const [isClient, setIsClient] = useState(false);
  const { state, dispatch } = useReservation();
  const [reservationData, setReservationData] = useState<ReservationData>({});
  const [calendarData, setCalendarData] = useState<{ [monthKey: string]: DayInfo[][] }>({});
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const generateDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const generateCalendar = useCallback((date: Date): DayInfo[][] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendar: DayInfo[][] = [];

    let week: DayInfo[] = [];
    for (let i = 0; i < firstDay; i++) {
      week.push({ 
        date: 0, 
        isCurrentMonth: false, 
        isAvailable: false, 
        price: null, 
        reservedUnits: 0,
        availableUnits: 0
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateString = generateDateString(currentDate);
      const price = getPriceForDate(currentDate);
      const reservationInfo = reservationData[dateString] || { total: 0, available: 2 };
      const isAvailable = price !== null && 
                          currentDate >= state.bookingStartDate && 
                          currentDate <= state.bookingEndDate &&
                          reservationInfo.available > 0;

      week.push({
        date: day,
        isCurrentMonth: true,
        isAvailable,
        price,
        reservedUnits: reservationInfo.total,
        availableUnits: reservationInfo.available,
      });

      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) {
        week.push({ 
          date: 0, 
          isCurrentMonth: false, 
          isAvailable: false, 
          price: null, 
          reservedUnits: 0,
          availableUnits: 0
        });
      }
      calendar.push(week);
    }

    return calendar;
  }, [reservationData, state.bookingStartDate, state.bookingEndDate]);

  useEffect(() => {
    console.log('Current start date changed:', currentStartDate);
    setIsClient(true);
    fetchReservationData(currentStartDate);
  }, [currentStartDate]);

  useEffect(() => {
    if (!hasError && isClient) {
      const monthsToDisplay = isMobile ? 1 : 2;
      const newCalendarData: { [monthKey: string]: DayInfo[][] } = {};

      for (let offset = 0; offset < monthsToDisplay; offset++) {
        const date = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + offset, 1);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        newCalendarData[monthKey] = generateCalendar(date);
      }

      setCalendarData(newCalendarData);
    }
  }, [currentStartDate, reservationData, generateCalendar, hasError, isClient, isMobile]);

  const fetchReservationData = async (date: Date) => {
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + (isMobile ? 1 : 2), 0);
  
    try {
      setIsLoading(true);
      setHasError(false);

      const startDateString = generateDateString(startDate);
      const endDateString = generateDateString(endDate);

      const response = await fetch(`/api/reservation-calendar?startDate=${startDateString}&endDate=${endDateString}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      console.log('Fetched reservation data:', data);

      const cleanedData = Object.entries(data).reduce((acc, [date, info]) => {
        const total = Math.min((info as any).total, 2);
        const available = Math.max(0, 2 - total);
        acc[date] = { total, available };
        return acc;
      }, {} as ReservationData);

      console.log('Cleaned reservation data:', cleanedData);

      setReservationData(cleanedData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch reservation data:', error);
      setHasError(true);
      setIsLoading(false);
    }
  };
  
  const handleDayClick = (day: DayInfo, monthOffset: number = 0) => {
    if (day.isCurrentMonth && day.isAvailable) {
      const selectedDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + monthOffset, day.date);
      onDateSelect(selectedDate);
  
      dispatch({ type: 'SET_DATE', payload: selectedDate });
      if (day.price) {
        dispatch({ type: 'SET_SELECTED_PRICE', payload: day.price });
      }
    }
  };

  const renderDayCell = (day: DayInfo, dayIndex: number, monthOffset: number = 0) => {
    const bgColor = !day.isCurrentMonth ? 'bg-gray-100' :
                    dayIndex === 0 ? 'bg-[#F9DEDD]' :
                    dayIndex === 6 ? 'bg-[#DFEEF2]' :
                    'bg-[#F2F2F2]';

    return (
      <td
        key={`day-${day.date}-${dayIndex}`}
        className={styles.dayCell}
        style={{ width: '14.28%', height: isMobile ? '60px' : '90px' }}
      >
        <div className={`${styles.dayCellInner}`}>
          <div className={`${styles.innerFrame} ${bgColor}`}>
            {day.isCurrentMonth ? (
              <div className={styles.dayContent}>
                <div className={styles.dayNumber}>{day.date}</div>
                {day.isAvailable ? (
                  <div
                    onClick={() => handleDayClick(day, monthOffset)}
                    className="flex flex-col items-end flex-1 justify-end cursor-pointer"
                  >
                    <div className={styles.priceText}>{day.price?.toLocaleString()}円</div>
                    <div className={styles.availableUnits}>残り{day.availableUnits}棟</div>
                  </div>
                ) : (
                  <div className={`${styles.unavailableMarker}`}>
                    {day.availableUnits <= 0 ? '満室' : '×'}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.dayContent}>
                <div className={styles.dayNumber}></div>
                <div className="flex-1"></div>
              </div>
            )}
          </div>
        </div>
      </td>
    );
  };

  const renderCalendar = (date: Date, monthOffset: number = 0) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthData = calendarData[monthKey];

    if (!monthData) {
      return null;
    }

    return (
      <div key={monthKey} className={styles.monthContainer}>
        <h4 className={styles.monthTitle} style={{ color: '#363331' }}>
          {`＜${date.getFullYear()}年${date.getMonth() + 1}月＞`}
        </h4>
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              {DAYS_OF_WEEK.map((day) => (
                <th key={day} className={styles.dayOfWeek}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
          {monthData.map((week, weekIndex) => (
            <tr key={`week-${weekIndex}`} className={isMobile ? "h-[60px]" : "h-[90px]"}>
              {week.map((day, dayIndex) => renderDayCell(day, dayIndex, monthOffset))}
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    );
  };

  const memoizedCalendarData = useMemo(() => {
    const monthsToDisplay = isMobile ? 1 : 2;
    const monthsArray = Array.from({ length: monthsToDisplay }, (_, i) => i);

    return monthsArray.map((offset) => {
      const displayDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + offset, 1);
      return renderCalendar(displayDate, offset);
    });
  }, [currentStartDate, calendarData, isMobile]);

  if (!isClient || isLoading) {
    return <div>Loading...</div>;
  }

  if (hasError) {
    return <div>Error: 正しい情報を取得できませんでした。後でもう一度お試しください。</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.calendarGrid}>
        {memoizedCalendarData}
      </div>
      <div className={styles.bottomInfo}>
        <div className={styles.bottomInfoText}>
          <span className={styles.bottomInfoItem}>数字・・・空き部屋</span>
          <span className={styles.bottomInfoItem}>×・・・空きなし</span>
          <span className={styles.bottomInfoItem}>ー・・・受付できません</span>
        </div>
      </div>
      <p className={styles.noticeText}>※宿泊日のみの記載となります。（食事付きプランをご利用の方は追加で食事代が必要です）</p>
    </div>
  );
}
