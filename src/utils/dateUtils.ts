import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Booking } from '../types';

export function formatDate(date: Date, pattern: string): string {
  return format(date, pattern, { locale: zhCN });
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function hasConflict(
  bookings: Booking[],
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): boolean {
  return bookings
    .filter(b => b.roomId === roomId && b.id !== excludeBookingId)
    .some(b => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return startTime < bEnd && endTime > bStart;
    });
}

export function getBookingsForDate(bookings: Booking[], date: Date, roomId?: string): Booking[] {
  return bookings.filter(b => {
    const bookingDate = new Date(b.startTime);
    const sameDay = isSameDay(bookingDate, date);
    const sameRoom = roomId ? b.roomId === roomId : true;
    return sameDay && sameRoom;
  });
}

export function getBookingsForWeek(bookings: Booking[], weekStart: Date, roomId?: string): Booking[] {
  const weekEnd = addDays(weekStart, 6);
  const weekStartDate = startOfDay(weekStart);
  const weekEndDate = endOfDay(weekEnd);
  
  return bookings.filter(b => {
    const bookingStart = new Date(b.startTime);
    const sameRoom = roomId ? b.roomId === roomId : true;
    return bookingStart >= weekStartDate && bookingStart <= weekEndDate && sameRoom;
  });
}

export function formatTime(dateStr: string): string {
  return format(new Date(dateStr), 'HH:mm');
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'yyyy-MM-dd HH:mm');
}

export function getTimeFromMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function getMinutesFromTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getNextBookingForRoom(
  bookings: Booking[],
  roomId: string,
  date: Date,
  afterTime: Date
): Booking | null {
  const dayBookings = getBookingsForDate(bookings, date, roomId);
  const upcoming = dayBookings
    .filter((b) => new Date(b.startTime) >= afterTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  return upcoming[0] || null;
}

export function computeDefaultEndTime(
  bookings: Booking[],
  roomId: string,
  date: Date,
  startTime: Date,
  defaultDurationMinutes: number,
  businessEndHour: number
): Date {
  const defaultEnd = new Date(startTime.getTime() + defaultDurationMinutes * 60 * 1000);
  const dayEnd = new Date(date);
  dayEnd.setHours(businessEndHour, 0, 0, 0);

  let endTime = defaultEnd > dayEnd ? dayEnd : defaultEnd;

  const nextBooking = getNextBookingForRoom(bookings, roomId, date, startTime);
  if (nextBooking) {
    const nextStart = new Date(nextBooking.startTime);
    if (nextStart < endTime && nextStart > startTime) {
      endTime = nextStart;
    }
  }

  if (endTime <= startTime) {
    endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
  }

  return endTime;
}
