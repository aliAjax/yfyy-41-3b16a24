import { Repeat } from 'lucide-react';
import { Booking } from '../types';
import { formatTime } from '../utils/dateUtils';
import { BUSINESS_START_HOUR, HOUR_HEIGHT } from '../constants';
import { useBookingStore } from '../store/useBookingStore';

interface BookingCardProps {
  booking: Booking;
  onClick?: () => void;
  compact?: boolean;
}

export function BookingCard({ booking, onClick, compact = false }: BookingCardProps) {
  const { getRoomById } = useBookingStore();
  const room = getRoomById(booking.roomId);
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  const height = durationHours * HOUR_HEIGHT - 4;
  
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const startOffset = (startMinutes - BUSINESS_START_HOUR * 60) * (HOUR_HEIGHT / 60);

  return (
    <div
      onClick={onClick}
      className="absolute left-1 right-1 rounded-lg px-2 py-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] overflow-hidden group"
      style={{
        top: `${startOffset + 2}px`,
        height: `${Math.max(height, 28)}px`,
        backgroundColor: room?.color || '#3b82f6',
        opacity: 0.9,
      }}
    >
      <div className="text-white text-xs font-medium truncate flex items-center gap-1">
        {booking.recurrenceId && (
          <Repeat className="w-3 h-3 flex-shrink-0" />
        )}
        <span className="truncate">{booking.title}</span>
      </div>
      {!compact && height > 40 && (
        <div className="text-white/80 text-xs mt-0.5 truncate">
          {booking.department}
        </div>
      )}
      {height > 60 && (
        <div className="text-white/70 text-xs mt-1">
          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
        </div>
      )}
      {height > 80 && booking.remarks && (
        <div className="text-white/60 text-xs mt-1 truncate">
          {booking.remarks}
        </div>
      )}
      
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-lg"></div>
    </div>
  );
}
