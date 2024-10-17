import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ja } from 'date-fns/locale';

const TIMEZONE = 'Asia/Tokyo';

export const formatJapaneseDate = (dateString: string): string => {
  const date = toZonedTime(parseISO(dateString), TIMEZONE);
  return format(date, "yyyy年MM月dd日(E)", { locale: ja });
};

export const formatJapaneseDateTime = (dateString: string): string => {
  const date = toZonedTime(parseISO(dateString), TIMEZONE);
  return format(date, "yyyy年MM月dd日(E) HH:mm", { locale: ja });
};