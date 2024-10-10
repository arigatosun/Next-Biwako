import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface GuestCounts {
  male: number;
  female: number;
  childWithBed: number;
  childNoBed: number;
}

interface DateSelectorProps {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  nights: number;
  setNights: React.Dispatch<React.SetStateAction<number>>;
  units: number;
  setUnits: React.Dispatch<React.SetStateAction<number>>;
  guestCounts: GuestCounts[];
  setGuestCounts: React.Dispatch<React.SetStateAction<GuestCounts[]>>;
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
  const handleGuestCountChange = (unitIndex: number, guestType: keyof GuestCounts, value: number) => {
    const newGuestCounts = [...guestCounts];
    newGuestCounts[unitIndex] = { ...newGuestCounts[unitIndex], [guestType]: Math.max(0, value) };
    setGuestCounts(newGuestCounts);
  };

  const handleDateChange = () => {
    // 日付変更ロジックを実装
    const newDate = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000); // 1日後の日付
    setSelectedDate(newDate);
  };

  return (
    <div className="text-[#000000] max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="font-semibold">宿泊日</span>
        <div className="flex items-center space-x-2 bg-gray-100 px-2 py-1 rounded-lg h-10">
          <span>
            {selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
          </span>
          <button 
            className="ml-1 px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs"
            onClick={handleDateChange}
          >
            宿泊日の変更
          </button>
        </div>
        <span className="font-medium">泊数</span>
        <div className="bg-gray-100 px-2 py-1 rounded-lg flex items-center h-10">
          <span>{nights}泊</span>
          <div className="flex flex-col ml-1">
            <button onClick={() => setNights(n => n + 1)} className="p-0.5">
              <ChevronUp size={14} />
            </button>
            <button onClick={() => setNights(n => Math.max(1, n - 1))} className="p-0.5">
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
        <span className="font-medium">棟数</span>
        <div className="bg-gray-100 px-2 py-1 rounded-lg flex items-center h-10">
          <span>{units}棟</span>
          <div className="flex flex-col ml-1">
            <button onClick={() => setUnits(u => Math.min(2, u + 1))} className="p-0.5">
              <ChevronUp size={14} />
            </button>
            <button onClick={() => setUnits(u => Math.max(1, u - 1))} className="p-0.5">
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {[...Array(units)].map((_, index) => (
        <div key={index} className="mb-6">
          <div className="flex items-start mb-2">
            <div className="flex flex-col mr-4">
              <h3 className="text-base font-semibold">ご利用人数 ({index + 1}棟目)</h3>
              <span className="text-xs">※棟の定員：2〜5名様</span>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg flex-grow">
              <div className="grid grid-cols-4 gap-2">
                {['男性', '女性', '小学生以下（寝具あり）', '小学生以下（添い寝）'].map((label, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-xs font-medium mb-1 whitespace-nowrap">{label}</span>
                    <div className="flex items-center bg-white rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleGuestCountChange(index, Object.keys(guestCounts[index])[i] as keyof GuestCounts, guestCounts[index][Object.keys(guestCounts[index])[i] as keyof GuestCounts] - 1)}
                        className="p-0.5 border-r border-gray-200"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <input
                        type="number"
                        value={guestCounts[index][Object.keys(guestCounts[index])[i] as keyof GuestCounts]}
                        onChange={(e) => handleGuestCountChange(index, Object.keys(guestCounts[index])[i] as keyof GuestCounts, parseInt(e.target.value) || 0)}
                        className="w-8 text-center py-0.5 text-sm"
                      />
                      <button
                        onClick={() => handleGuestCountChange(index, Object.keys(guestCounts[index])[i] as keyof GuestCounts, guestCounts[index][Object.keys(guestCounts[index])[i] as keyof GuestCounts] + 1)}
                        className="p-0.5 border-l border-gray-200"
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