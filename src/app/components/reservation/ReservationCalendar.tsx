"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  nextMonthButton: "bg-[#363331] text-white px-3 sm:px-7 py-1.5 sm:py-2.5 rounded-full flex items-center font-semibold text-sm sm:text-base",
  prevMonthButton: "bg-[#999999] text-white px-3 sm:px-7 py-1.5 sm:py-2.5 rounded-full flex items-center font-semibold text-sm sm:text-base",
};

export default function ReservationCalendar({ onDateSelect, isMobile }: ReservationCalendarProps): React.ReactElement {
  const [isClient, setIsClient] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2024, 9, 1));

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
      const isAvailable = Math.random() > 0.3;
      week.push({
        date: day,
        isCurrentMonth: true,
        isAvailable,
        price: isAvailable ? (Math.random() > 0.5 ? 68000 : 78000) : null
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

  const handlePrevMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onDateSelect(selectedDate);
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [year, month] = event.target.value.split('-').map(Number);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const renderDayCell = (day: DayInfo, dayIndex: number) => {
    const bgColor = !day.isCurrentMonth ? 'bg-gray-100' :
                    dayIndex === 0 ? 'bg-[#F9DEDD]' :
                    dayIndex === 6 ? 'bg-[#DFEEF2]' :
                    'bg-[#F2F2F2]';

    return (
      <td key={`day-${day.date}-${dayIndex}`} className={styles.dayCell} style={{ width: '14.28%', height: isMobile ? '60px' : '90px' }}>
        <div className={`${styles.dayCellInner}`}>
          <div className={`${styles.innerFrame} ${bgColor}`}>
            {day.isCurrentMonth ? (
              <div className={styles.dayContent}>
                <div className={styles.dayNumber}>{day.date}</div>
                {day.isAvailable ? (
                  <div 
                    onClick={() => handleDayClick(day.date)}
                    className="flex flex-col items-end flex-1 justify-end cursor-pointer"
                  >
                    <span className={`${styles.priceNumber} ${day.price === 78000 ? 'text-blue-500' : 'text-[#363331]'}`}>
                      {day.price === 78000 ? '1' : '2'}
                    </span>
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

  const renderCalendar = (date: Date) => {
    const monthCalendar = generateCalendar(date);
    return (
      <div key={`${date.getFullYear()}-${date.getMonth()}`} className={styles.monthContainer}>
        <h4 className={styles.monthTitle} style={{ color: '#363331' }}>{`＜${date.getFullYear()}年${date.getMonth() + 1}月＞`}</h4>
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
                {week.map((day, dayIndex) => renderDayCell(day, dayIndex))}
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
      {isMobile ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className={styles.prevMonthButton}>
              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-2.5" />
              前月
            </button>
            <select
              value={`${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`}
              onChange={handleMonthChange}
              className="bg-white border border-gray-300 rounded-md px-1 sm:px-2 py-1 text-sm sm:text-base"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(currentDate.getFullYear(), i, 1);
                return (
                  <option key={i} value={`${date.getFullYear()}-${i + 1}`}>
                    {date.getFullYear()}年{i + 1}月
                  </option>
                );
              })}
            </select>
            <button onClick={handleNextMonth} className={styles.nextMonthButton}>
              次月
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1 sm:ml-2.5" />
            </button>
          </div>
          {renderCalendar(currentDate)}
        </div>
      ) : (
        <div className={styles.calendarGrid}>
          {[0, 1].map((offset) => {
            const displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
            return renderCalendar(displayDate);
          })}
        </div>
      )}
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