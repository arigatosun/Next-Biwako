'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/common/Layout';
import ReservationProcess from '@/app/components/reservation/ReservationProcess';
import RoomInformationSlider from '../components/Guest-selection/RoomInformationSlider';
import DateSelector from '../components/Guest-selection/DateSelector';
import { useReservation } from '@/app/contexts/ReservationContext';
import { format, addDays, isValid } from 'date-fns'; // isValid をインポート

// ここでgetPriceForDateをインポートします
import { getPriceForDate } from '@/app/data/roomPrices';

interface GuestCounts {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

interface AvailableDates {
  [date: string]: {
    totalReserved: number;
    available: number;
  };
}

export default function GuestSelectionPage() {
  const router = useRouter();
  const { state, dispatch } = useReservation();
  const [currentStep, setCurrentStep] = useState(2);
  const [nights, setNights] = useState(state.nights);
  const [units, setUnits] = useState(state.units);
  const [guestCounts, setGuestCounts] = useState<GuestCounts[]>(state.guestCounts);
  const [totalPrice, setTotalPrice] = useState<number>(state.totalPrice || 0);
  const initialDate = state.selectedDate || new Date();
  const [availableDates, setAvailableDates] = useState<AvailableDates>({});
  const [maxNights, setMaxNights] = useState(1);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // generateDailyRates関数でgetPriceForDateを使用します
  const generateDailyRates = useCallback(() => {
    if (!state.selectedDate) return [];

    const dailyRates = Array(nights).fill(null).map((_, index) => {
      const date = addDays(state.selectedDate!, index);
      const priceForDate = getPriceForDate(date);

      if (priceForDate === null) {
        console.error(`No price data available for date: ${date}`);
        return null;
      }

      return {
        date: date,
        price: priceForDate, // 1棟あたりの価格
        mealPlans: [], // ここで空のmealPlansを追加
      };
    }).filter(rate => rate !== null);

    return dailyRates as {
      date: Date;
      price: number;
      mealPlans: any[];
    }[];
  }, [state.selectedDate, nights]);

  useEffect(() => {
    if (!state.selectedDate) {
      router.push('/reservation');
    } else {
      const dailyRates = generateDailyRates();
      dispatch({ type: 'SET_DAILY_RATES', payload: dailyRates });
    }

    dispatch({
      type: 'SET_BOOKING_PERIOD',
      payload: {
        start: new Date(),
        end: new Date(new Date().getFullYear() + 1, 12, 31),
      },
    });

    fetchAvailableDates();
  }, [state.selectedDate, router, dispatch, generateDailyRates]);

  useEffect(() => {
    if (state.selectedDate && Object.keys(availableDates).length > 0) {
      const maxConsecutiveNights = calculateMaxConsecutiveNights(
        state.selectedDate,
        availableDates,
        units // unitsを渡す
      );
      setMaxNights(maxConsecutiveNights);
      console.log('Calculated maxNights:', maxConsecutiveNights);
    }
  }, [state.selectedDate, availableDates, units]);

  // 棟数や泊数が変更された際にdailyRatesを更新
  useEffect(() => {
    const dailyRates = generateDailyRates();
    dispatch({ type: 'SET_DAILY_RATES', payload: dailyRates });

    // 宿泊料金を再計算
    const roomPrice = dailyRates.reduce((sum, dailyRate) => {
      return sum + dailyRate.price * units;
    }, 0);

    setTotalPrice(roomPrice);
    dispatch({ type: 'SET_TOTAL_PRICE', payload: roomPrice });
  }, [nights, units, generateDailyRates, dispatch]);

  const fetchAvailableDates = async () => {
    try {
      const today = new Date();
      const oneYearLater = new Date(today);
      oneYearLater.setFullYear(today.getFullYear() + 1);

      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(oneYearLater, 'yyyy-MM-dd');

      const url = `/api/reservation-calendar?startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url);

      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);

      const text = await response.text();
      console.log('API Response text:', text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error('Invalid JSON response from server');
      }

      console.log('Parsed API Response:', data);

      if (data && typeof data === 'object') {
        const formattedData: AvailableDates = data;

        setAvailableDates(formattedData);
        setError(null);
        console.log('Formatted available dates:', formattedData);
      } else {
        throw new Error('Invalid data format from API');
      }
    } catch (error) {
      console.error('Failed to fetch available dates:', error);
      setAvailableDates({});
      setError('予約可能な日付の取得に失敗しました。しばらくしてからもう一度お試しください。');
    }
  };

  /**
   * 最大連続宿泊日数を計算する関数
   * @param startDate 開始日
   * @param availableDates 利用可能な日付情報
   * @param units 必要な宿泊棟数
   * @returns 最大連続宿泊日数
   */
  const calculateMaxConsecutiveNights = (
    startDate: Date,
    availableDates: AvailableDates,
    units: number
  ): number => {
    let consecutiveNights = 0;
    let currentDate = new Date(startDate);
    const maxDays = 365; // 無限ループを防ぐための上限日数

    for (let i = 0; i < maxDays; i++) {
      // currentDate の有効性を検証
      if (!isValid(currentDate)) {
        console.error('無効な currentDate が検出されました:', currentDate);
        break;
      }

      const dateString = format(currentDate, 'yyyy-MM-dd');
      const availableInfo = availableDates[dateString];
      const availableUnits = isBlackoutDate(currentDate) ? 0 : (availableInfo ? availableInfo.available : 2);

      if (availableUnits < units) {
        break;
      }

      consecutiveNights++;
      currentDate = addDays(currentDate, 1); // 不変性を保つために addDays を使用
    }

    return Math.max(consecutiveNights, 1);
  };

  // ブラックアウト日判定（8月全日 + 8月以外の土曜日）
  function isBlackoutDate(date: Date): boolean {
    const month = date.getMonth();
    if (month === 7) return true; // August
    if (month !== 7 && date.getDay() === 6) return true; // Saturday outside August
    return false;
  }

  const handleStepClick = (step: number) => {
    switch (step) {
      case 1:
        router.push('/reservation');
        break;
      case 3:
        router.push('/food-plan');
        break;
      default:
        break;
    }
  };

  const handleGuestCountChange = (newGuestCounts: GuestCounts[]) => {
    setGuestCounts(newGuestCounts);
    dispatch({ type: 'SET_GUEST_COUNTS', payload: newGuestCounts });
  };

  const handleNightsChange = (newNights: number) => {
    setNights(newNights);
    dispatch({ type: 'SET_NIGHTS', payload: newNights });
  };

  const handleUnitsChange = (newUnits: number) => {
    setUnits(newUnits);
    dispatch({ type: 'SET_UNITS', payload: newUnits });
  };

  const totalGuests = guestCounts.reduce(
    (total, unit) => total + Object.values(unit).reduce((sum, count) => sum + count, 0),
    0
  );

  const toFullWidth = (num: number): string => {
    return num
      .toString()
      .split('')
      .map((char) => String.fromCharCode(char.charCodeAt(0) + 0xfee0))
      .join('');
  };

  const handleNextStep = () => {
    if (warning) {
      // 警告がある場合は次のステップに進めない
      return;
    }

    const guestSelectionData = {
      selectedDate: state.selectedDate
        ? state.selectedDate.toISOString()
        : new Date().toISOString(),
      nights,
      units,
      guestCounts,
      totalPrice,
      totalGuests,
    };
    console.log('Saving guestSelectionData:', guestSelectionData);
    localStorage.setItem('guestSelectionData', JSON.stringify(guestSelectionData));
    router.push('/food-plan');
  };

  return (
    <>
      {/* 不要な<Layout>コンポーネントと外側の<div>を削除 */}
      <ReservationProcess currentStep={currentStep} onStepClick={handleStepClick} />
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-white p-4">
          <h2 className="text-[#00A2EF] text-xl sm:text-2xl font-bold text-center">
            <span className="block sm:inline">【一棟貸切！】</span>
            <span className="block sm:inline sm:ml-1">贅沢遊びつくしヴィラプラン</span>
          </h2>
          <div className="text-center text-[#00A2EF] text-2xl mt-1">▼</div>
        </div>
        
        <RoomInformationSlider />

        <div className="p-4 sm:p-6">
          <DateSelector
            selectedDate={initialDate}
            setSelectedDate={(date) => dispatch({ type: 'SET_DATE', payload: date })}
            nights={nights}
            setNights={handleNightsChange}
            units={units}
            setUnits={handleUnitsChange}
            guestCounts={guestCounts}
            setGuestCounts={handleGuestCountChange}
            availableDates={availableDates}
            maxNights={maxNights}
            warning={warning}
            setWarning={setWarning}
          />
          <div className="mt-4 flex justify-end">
            <div className="flex items-center space-x-2 mr-4 sm:mr-[90px]">
              <span className="text-base sm:text-lg font-extrabold mr-2 text-black">
                合計
              </span>
              <span className="bg-gray-100 px-3 py-2 sm:py-3 rounded-lg font-extrabold inline-block text-black">
                {toFullWidth(totalGuests)}人
              </span>
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleNextStep}
              className={`bg-[#00A2EF] text-white font-bold py-3 px-6 rounded-full hover:bg-blue-600 transition duration-300 text-sm sm:text-base ${
                warning ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!!warning}
            >
              食事プラン選択へ進む
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}