import { useBookingStore } from '../store/useBookingStore';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { DepartmentFilter } from './DepartmentFilter';
import { ViewSelector } from './ViewSelector';
import { Booking } from '../types';

interface CalendarViewProps {
  onBookingClick?: (booking: Booking) => void;
}

export function CalendarView({ onBookingClick }: CalendarViewProps) {
  const { viewMode, selectedRoomId, currentDate, getRoomById } = useBookingStore();
  const room = getRoomById(selectedRoomId);

  return (
    <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
      <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div
            className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: room?.color || '#3b82f6' }}
          ></div>
          <div className="min-w-0">
            <h2 className="text-sm md:text-base lg:text-lg font-semibold text-slate-800 truncate">
              {room?.name || '会议室'}
            </h2>
            <span className="hidden md:inline text-xs lg:text-sm text-slate-400">
              {room?.location} · 容纳{room?.capacity}人
            </span>
          </div>
        </div>
        <div className="hidden sm:block text-xs md:text-sm text-slate-500 whitespace-nowrap flex-shrink-0">
          {viewMode === 'day' ? '今日日程' : '本周日程'}
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 py-2 md:py-3 border-b border-slate-100 flex-shrink-0">
        <ViewSelector />
      </div>

      <div className="px-3 sm:px-4 md:px-6 py-2 md:py-3 border-b border-slate-100 flex-shrink-0">
        <DepartmentFilter />
      </div>
      
      <div className="flex-1 min-h-0 overflow-auto">
        {viewMode === 'day' ? (
          <div className="h-full pl-10 md:pl-14 pr-2 md:pr-4 py-3 md:py-4">
            <DayView
              date={currentDate}
              roomId={selectedRoomId}
              onBookingClick={onBookingClick}
            />
          </div>
        ) : (
          <div className="h-full min-w-[600px] md:min-w-0">
            <WeekView onBookingClick={onBookingClick} />
          </div>
        )}
      </div>
    </div>
  );
}
