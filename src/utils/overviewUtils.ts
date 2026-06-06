import { Booking, MeetingRoom, RoomStatusInfo, TodayOverviewData, RoomStatus } from '../types';
import { isSameDay, isAfter } from 'date-fns';
import { getBookingsForDate } from './dateUtils';

export function getRoomStatus(
  bookings: Booking[],
  roomId: string,
  now: Date = new Date()
): RoomStatus {
  const roomBookings = bookings.filter((b) => b.roomId === roomId);

  const hasActiveMeeting = roomBookings.some((b) => {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    return now >= start && now < end;
  });

  if (hasActiveMeeting) return 'busy';
  return 'free';
}

export function getCurrentBooking(
  bookings: Booking[],
  roomId: string,
  now: Date = new Date()
): Booking | undefined {
  const roomBookings = bookings.filter((b) => b.roomId === roomId);

  return roomBookings.find((b) => {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    return now >= start && now < end;
  });
}

export function getNextBooking(
  bookings: Booking[],
  roomId: string,
  now: Date = new Date()
): Booking | undefined {
  const roomBookings = bookings.filter((b) => {
    if (b.roomId !== roomId) return false;
    const start = new Date(b.startTime);
    return isAfter(start, now);
  });

  roomBookings.sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  return roomBookings[0];
}

export function getRoomStatusInfoList(
  bookings: Booking[],
  rooms: MeetingRoom[],
  date: Date,
  now: Date = new Date()
): RoomStatusInfo[] {
  const todayBookings = getBookingsForDate(bookings, date);

  return rooms.map((room) => {
    const roomTodayBookings = todayBookings.filter((b) => b.roomId === room.id);
    const status = isSameDay(date, new Date())
      ? getRoomStatus(bookings, room.id, now)
      : 'unknown';
    const currentBooking = isSameDay(date, new Date())
      ? getCurrentBooking(bookings, room.id, now)
      : undefined;
    const nextBooking = getNextBooking(bookings, room.id, now);

    return {
      roomId: room.id,
      roomName: room.name,
      status,
      currentBooking,
      nextBooking,
      todayBookingCount: roomTodayBookings.length,
    };
  });
}

export function getActiveMeetings(
  bookings: Booking[],
  now: Date = new Date()
): Booking[] {
  const active = bookings.filter((b) => {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    return now >= start && now < end;
  });

  return active.sort((a, b) => {
    return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
  });
}

export function getUpcomingMeetings(
  bookings: Booking[],
  date: Date,
  now: Date = new Date()
): Booking[] {
  const todayBookings = getBookingsForDate(bookings, date);

  const upcoming = todayBookings.filter((b) => {
    const start = new Date(b.startTime);
    return isAfter(start, now);
  });

  return upcoming.sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}

export function getTodayOverviewData(
  bookings: Booking[],
  rooms: MeetingRoom[],
  date: Date,
  now: Date = new Date()
): TodayOverviewData {
  const todayBookings = getBookingsForDate(bookings, date);
  const roomStatuses = getRoomStatusInfoList(bookings, rooms, date, now);
  const activeMeetings = isSameDay(date, new Date())
    ? getActiveMeetings(bookings, now)
    : [];
  const upcomingMeetings = getUpcomingMeetings(bookings, date, now);

  const freeRoomCount = roomStatuses.filter((r) => r.status === 'free').length;
  const busyRoomCount = roomStatuses.filter((r) => r.status === 'busy').length;

  return {
    totalBookings: todayBookings.length,
    activeMeetings,
    upcomingMeetings,
    roomStatuses,
    freeRoomCount,
    busyRoomCount,
  };
}

export function formatMeetingDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins}分钟`;
  }

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (mins === 0) {
    return `${hours}小时`;
  }

  return `${hours}小时${mins}分钟`;
}

export function getTimeUntilMeeting(startTime: string, now: Date = new Date()): string {
  const start = new Date(startTime);
  const diffMs = start.getTime() - now.getTime();

  if (diffMs <= 0) {
    return '进行中';
  }

  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins}分钟后开始`;
  }

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (mins === 0) {
    return `${hours}小时后开始`;
  }

  return `${hours}小时${mins}分钟后开始`;
}
