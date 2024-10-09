"use client";

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']

interface DayInfo {
  date: number;
  isCurrentMonth: boolean;
  isAvailable: boolean;
  price: number | null;
}

interface ReservationCalendarProps {
  onDateSelect: (date: Date) => void;
}

const styles = {
  container: "bg-white p-6 w-full max-w-7xl mx-auto",
  calendarGrid: "grid grid-cols-2 gap-10",
  monthContainer: "border rounded-lg p-5",
  monthTitle: "text-2xl font-bold mb-5 text-center",
  dayCell: "p-0 m-0 border border-transparent",
  dayCellInner: "w-full h-full flex items-center justify-center",
  innerFrame: "w-full h-full rounded-lg overflow-hidden flex items-center justify-center",
  dayContent: "w-full h-full flex flex-col justify-between p-2",
  dayNumber: "text-base text-[#363331]",
  priceNumber: "text-2xl font-bold",
  priceText: "text-sm text-blue-500",
  unavailableMarker: "text-3xl text-gray-400 flex items-center justify-center flex-1",
  bottomInfo: "mt-8 bg-[#999999] p-4 rounded-lg",
  bottomInfoText: "flex items-center justify-center space-x-6",
  bottomInfoItem: "text-white font-extrabold text-base",
  noticeText: "mt-4 text-base text-gray-600",
  dayOfWeek: "text-center p-2 text-base rounded-full bg-[#999999] text-white font-extrabold",
  nextMonthButton: "bg-[#363331] text-white px-8 py-3 rounded-full flex items-center font-semibold text-lg",
  prevMonthButton: "bg-[#999999] text-white px-8 py-3 rounded-full flex items-center font-semibold text-lg",
};

export default function ReservationCalendar({ onDateSelect }: ReservationCalendarProps): React.ReactElement {
  const [isClient, setIsClient] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2024, 9, 1));
  const [calendar, setCalendar] = useState<DayInfo[][]>([]);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    setCalendar(generateCalendar(currentDate));
  }, [currentDate]);

  const generateCalendar = (date: Date): DayInfo[][] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendar: DayInfo[][] = [];

    let week: DayInfo[] = [];
    // 前月の日付を埋める
    for (let i = 0; i < firstDay; i++) {
      week.push({ date: 0, isCurrentMonth: false, isAvailable: false, price: null });
    }

    // 当月の日付を埋める
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

    // 次月の日付を埋める
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
    router.push(`/reservation/${day}`);
  };

  const renderDayCell = (day: DayInfo, dayIndex: number) => {
    const isWeekend = dayIndex === 0 || dayIndex === 6;
    const bgColor = !day.isCurrentMonth ? 'bg-gray-100' :
                    dayIndex === 0 ? 'bg-[#F9DEDD]' :
                    dayIndex === 6 ? 'bg-[#DFEEF2]' :
                    'bg-[#F2F2F2]';

    return (
      <td key={`day-${day.date}-${dayIndex}`} className={styles.dayCell} style={{ width: '14.28%', height: '100px' }}>
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

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className="flex justify-between mb-6">
        <button onClick={handlePrevMonth} className={styles.prevMonthButton}>
          <ChevronLeft className="w-4 h-4 mr-3" />
          前月に戻る
        </button>
        <button onClick={handleNextMonth} className={styles.nextMonthButton}>
          次月をみる
          <ChevronRight className="w-4 h-4 ml-3" />
        </button>
      </div>
      <div className={styles.calendarGrid}>
        {[0, 1].map((offset) => {
          const displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
          const monthCalendar = generateCalendar(displayDate);
          return (
            <div key={`${displayDate.getFullYear()}-${displayDate.getMonth()}`} className={styles.monthContainer}>
            <h4 className={styles.monthTitle} style={{ color: '#363331' }}>{`＜${displayDate.getFullYear()}年${displayDate.getMonth() + 1}月＞`}</h4>
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
                  <tr key={`week-${weekIndex}`} className="h-[100px]">
                    {week.map((day, dayIndex) => renderDayCell(day, dayIndex))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
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