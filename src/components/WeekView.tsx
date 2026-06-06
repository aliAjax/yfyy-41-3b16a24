import { useBookingStore } from '../store/useBookingStore';
import { getWeekDays, getBookingsForDate, formatDate, isToday } from '../utils/dateUtils';
import { BookingCard } from './BookingCard';
import { BUSINESS_START_HOUR, BUSINESS_END_HOUR, HOUR_HEIGHT, MEETING_ROOMS } from '../constants';
import { Booking } from '../types';

interface WeekViewProps {
  onBookingClick?: (booking: Booking) => void;
}

export function WeekView({ onBookingClick }: WeekViewProps) {
  const { currentDate, bookings, selectedRoomId } = useBookingStore();
  const weekDays = getWeekDays(currentDate);
  const room = MEETING_ROOMS.find((r) => r.id === selectedRoomId);
  
  const hours = [];
  for (let h = BUSINESS_START_HOUR; h < BUSINESS_END_HOUR; h++) {
    hours.push(h);
  }

  const totalHeight = (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * HOUR_HEIGHT;

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
        <div className="w-14 flex-shrink-0"></div>
        <div className="flex-1 flex min-w-0">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`flex-1 text-center py-3 font-medium text-sm min-w-0 ${
                isToday(day)
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                  : 'bg-slate-50 text-slate-600'
              }`}
            >
              <p className="font-semibold truncate">{formatDate(day, 'MM月dd日')}</p>
              <p className="text-xs opacity-70 truncate">{formatDate(day, 'EEEE')}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-14 flex-shrink-0 bg-white border-r border-slate-100">
          <div className="relative" style={{ height: `${totalHeight}px` }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -top-2.5 text-xs text-slate-400 whitespace-nowrap"
                style={{ top: `${(hour - BUSINESS_START_HOUR) * HOUR_HEIGHT}px` }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex-1 flex min-w-0">
          {weekDays.map((day, dayIndex) => {
            const dayBookings = getBookingsForDate(bookings, day, selectedRoomId);
            
            return (
              <div
                key={dayIndex}
                className={`flex-1 relative border-r border-slate-100 last:border-r-0 min-w-0 ${
                  isToday(day) ? 'bg-blue-50/30' : ''
                }`}
                style={{ height: `${totalHeight}px` }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-slate-100"
                    style={{ top: `${(hour - BUSINESS_START_HOUR) * HOUR_HEIGHT}px` }}
                  ></div>
                ))}
                
                <div className="absolute inset-0 px-1">
                  {dayBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onClick={() => onBookingClick?.(booking)}
                      compact
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
