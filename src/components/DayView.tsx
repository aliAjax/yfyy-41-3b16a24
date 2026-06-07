import { useBookingStore } from '../store/useBookingStore';
import { getBookingsForDate, formatDate, isToday, computeDefaultEndTime } from '../utils/dateUtils';
import { BookingCard } from './BookingCard';
import { BUSINESS_START_HOUR, BUSINESS_END_HOUR, HOUR_HEIGHT } from '../constants';
import { Booking } from '../types';

interface DayViewProps {
  date: Date;
  roomId?: string;
  onBookingClick?: (booking: Booking) => void;
  showHeader?: boolean;
}

export function DayView({ date, roomId, onBookingClick, showHeader = false }: DayViewProps) {
  const { bookings, selectedRoomId, selectedDepartment, setPrefilledFormData } = useBookingStore();
  const actualRoomId = roomId || selectedRoomId;
  
  const dayBookings = getBookingsForDate(bookings, date, actualRoomId).filter((booking) => {
    if (selectedDepartment === 'all') return true;
    return booking.department === selectedDepartment;
  });
  
  const hours = [];
  for (let h = BUSINESS_START_HOUR; h < BUSINESS_END_HOUR; h++) {
    hours.push(h);
  }

  const halfHourSlots = [];
  for (let h = BUSINESS_START_HOUR; h < BUSINESS_END_HOUR; h++) {
    for (let m = 0; m < 60; m += 30) {
      halfHourSlots.push({ hour: h, minute: m });
    }
  }

  const totalHeight = (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * HOUR_HEIGHT;

  const handleSlotClick = (hour: number, minute: number) => {
    const startTime = new Date(date);
    startTime.setHours(hour, minute, 0, 0);
    const endTime = computeDefaultEndTime(bookings, actualRoomId, date, startTime, 60, BUSINESS_END_HOUR);
    setPrefilledFormData({
      roomId: actualRoomId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });
  };

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {showHeader && (
        <div
          className={`text-center py-2 font-medium text-sm border-b border-slate-200 ${
            isToday(date) ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
          }`}
        >
          <p>{formatDate(date, 'MM月dd日')}</p>
          <p className="text-xs text-slate-500">{formatDate(date, 'EEEE')}</p>
        </div>
      )}
      
      <div className="relative flex-1 overflow-y-auto">
        <div className="relative" style={{ height: `${totalHeight}px`, minHeight: '100%' }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-slate-100"
              style={{ top: `${(hour - BUSINESS_START_HOUR) * HOUR_HEIGHT}px` }}
            >
              <span className="absolute -left-1 -translate-x-full -top-2.5 text-xs text-slate-400 w-12 text-right pr-2">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}
          
          <div className="absolute left-12 right-0 top-0 bottom-0">
            {halfHourSlots.map((slot, index) => (
              <div
                key={index}
                className="absolute left-0 right-0 cursor-pointer hover:bg-blue-50/50 transition-colors border-b border-slate-50"
                style={{
                  top: `${(slot.hour - BUSINESS_START_HOUR) * HOUR_HEIGHT + (slot.minute / 60) * HOUR_HEIGHT}px`,
                  height: `${HOUR_HEIGHT / 2}px`,
                }}
                onClick={() => handleSlotClick(slot.hour, slot.minute)}
              />
            ))}
            {dayBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => onBookingClick?.(booking)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
