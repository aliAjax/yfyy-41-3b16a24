import { Booking, MeetingRoom } from '../types';
import { getBookingsForWeek } from './dateUtils';
import { startOfWeek } from 'date-fns';

export interface RoomWeekStats {
  roomId: string;
  roomName: string;
  color: string;
  bookingCount: number;
  totalDurationMinutes: number;
  avgDurationMinutes: number;
}

function getBookingDurationMinutes(booking: Booking): number {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / 60000);
}

export function getRoomWeekStats(
  bookings: Booking[],
  rooms: MeetingRoom[],
  currentDate: Date
): RoomWeekStats[] {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekBookings = getBookingsForWeek(bookings, weekStart);

  return rooms
    .map((room) => {
      const roomBookings = weekBookings.filter((b) => b.roomId === room.id);
      const bookingCount = roomBookings.length;
      const totalDurationMinutes = roomBookings.reduce(
        (sum, booking) => sum + getBookingDurationMinutes(booking),
        0
      );
      const avgDurationMinutes =
        bookingCount > 0 ? Math.round(totalDurationMinutes / bookingCount) : 0;

      return {
        roomId: room.id,
        roomName: room.name,
        color: room.color,
        bookingCount,
        totalDurationMinutes,
        avgDurationMinutes,
      };
    })
    .sort((a, b) => b.bookingCount - a.bookingCount || b.totalDurationMinutes - a.totalDurationMinutes);
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}小时`;
  }

  return `${hours}小时${mins}分钟`;
}

export function formatDurationHours(minutes: number): string {
  const hours = (minutes / 60).toFixed(1);
  return `${hours}小时`;
}
