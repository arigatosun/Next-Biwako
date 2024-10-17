// src/app/components/Guest-selection/CustomDatePicker.tsx

import React, { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ja } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

registerLocale('ja', ja);

interface CustomDatePickerProps {
  selectedDate: Date;
  onChange: (date: Date | null) => void;
  minDate: Date;
  maxDate: Date;
  filterDate?: (date: Date) => boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedDate,
  onChange,
  minDate,
  maxDate,
  filterDate,
}) => {
  const [startDate, setStartDate] = useState(selectedDate);

  const years = Array.from(
    { length: maxDate.getFullYear() - minDate.getFullYear() + 1 },
    (_, i) => minDate.getFullYear() + i
  );
  const months = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ];

  return (
    <DatePicker
      selected={startDate}
      onChange={(date: Date | null) => {
        setStartDate(date as Date);
        onChange(date);
      }}
      locale="ja"
      dateFormat="yyyy年MM月dd日"
      minDate={minDate}
      maxDate={maxDate}
      filterDate={filterDate}
      renderCustomHeader={({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className="flex items-center justify-between px-2 py-2">
          <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="p-1">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex space-x-2">
            <select
              value={date.getFullYear()}
              onChange={({ target: { value } }) => changeYear(Number(value))}
              className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
            >
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}年
                </option>
              ))}
            </select>
            <select
              value={months[date.getMonth()]}
              onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
              className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
            >
              {months.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="p-1">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      )}
      inline
    />
  );
};

export default CustomDatePicker;
