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
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: room?.color || '#3b82f6' }}
          ></div>
          <h2 className="text-lg font-semibold text-slate-800 whitespace-nowrap">
            {room?.name || '会议室'}
          </h2>
          <span className="text-sm text-slate-400 whitespace-nowrap">
            {room?.location} · 容纳{room?.capacity}人
          </span>
        </div>
        <div className="text-sm text-slate-500 whitespace-nowrap">
          {viewMode === 'day' ? '今日日程' : '本周日程'}
        </div>
      </div>

      <div className="px-6 py-3 border-b border-slate-100 flex-shrink-0">
        <ViewSelector />
      </div>

      <div className="px-6 py-3 border-b border-slate-100 flex-shrink-0">
        <DepartmentFilter />
      </div>
      
      <div className="flex-1 min-h-0 overflow-auto">
        {viewMode === 'day' ? (
          <div className="h-full pl-14 pr-4 py-4">
            <DayView
              date={currentDate}
              roomId={selectedRoomId}
              onBookingClick={onBookingClick}
            />
          </div>
        ) : (
          <div className="h-full">
            <WeekView onBookingClick={onBookingClick} />
          </div>
        )}
      </div>
    </div>
  );
}
