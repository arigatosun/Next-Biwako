import React from 'react';
import { formatJapaneseDate, formatJapaneseDateTime } from '@/utils/dateUtils';

interface DateDisplayProps {
  dateString: string;
  showTime?: boolean;
}

const DateDisplay: React.FC<DateDisplayProps> = ({ dateString, showTime = false }) => {
  const formattedDate = showTime 
    ? formatJapaneseDateTime(dateString)
    : formatJapaneseDate(dateString);

  return <span>{formattedDate}</span>;
};

export default DateDisplay;