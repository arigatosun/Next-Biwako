"use client";

import React, { useState, useEffect } from 'react';
import { useReservation } from '@/app/contexts/ReservationContext';
import { getPriceForDate } from '@/app/data/roomPrices';

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

interface DayInfo {
  date: number;
  isCurrentMonth: boolean;
  isAvailable: boolean;
  price: number | null;
}

interface ReservationCalendarProps {
  onDateSelect: (date: Date) => void;
  isMobile: boolean;
  currentDate: Date;
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
};

export default function ReservationCalendar({ onDateSelect, isMobile, currentDate }: ReservationCalendarProps): React.ReactElement {
  const [isClient, setIsClient] = useState(false);
  const { state, dispatch } = useReservation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const generateCalendar = (date: Date): DayInfo[][] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendar: DayInfo[][] = [];

    let week: DayInfo[] = [];
    for (let i = 0; i < firstDay; i++) {
      week.push({ date: 0, isCurrentMonth: false, isAvailable: false, price: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const price = getPriceForDate(currentDate);
      const isAvailable = price !== null && 
                          currentDate >= state.bookingStartDate && 
                          currentDate <= state.bookingEndDate;
      week.push({
        date: day,
        isCurrentMonth: true,
        isAvailable,
        price,
      });

      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) {
        week.push({ date: 0, isCurrentMonth: false, isAvailable: false, price: null });
      }
      calendar.push(week);
    }

    return calendar;
  };
  
  const handleDayClick = (day: DayInfo, monthOffset: number = 0) => {
    if (day.isCurrentMonth && day.isAvailable) {
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, day.date);
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
                  </div>
                ) : (
                  <div className={`${styles.unavailableMarker}`}>×</div>
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
    const monthCalendar = generateCalendar(date);
    return (
      <div key={`${date.getFullYear()}-${date.getMonth()}`} className={styles.monthContainer}>
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
          {monthCalendar.map((week, weekIndex) => (
            <tr key={`week-${weekIndex}`} className={isMobile ? "h-[60px]" : "h-[90px]"}>
              {week.map((day, dayIndex) => renderDayCell(day, dayIndex, monthOffset))}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    );
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.calendarGrid}>
        {isMobile ? (
          renderCalendar(currentDate)
        ) : (
          [0, 1].map((offset) => {
            const displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
            return renderCalendar(displayDate, offset);
          })
        )}
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