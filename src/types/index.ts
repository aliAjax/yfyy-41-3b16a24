export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  location: string;
  color: string;
}

export interface Booking {
  id: string;
  roomId: string;
  title: string;
  department: string;
  attendees: number;
  startTime: string;
  endTime: string;
  contact: string;
  phone: string;
  createdAt: string;
}

export type ViewMode = 'day' | 'week';

export type RoomStatus = 'free' | 'busy' | 'unknown';

export interface RoomStatusInfo {
  roomId: string;
  roomName: string;
  status: RoomStatus;
  currentBooking?: Booking;
  nextBooking?: Booking;
  todayBookingCount: number;
}

export interface TodayOverviewData {
  totalBookings: number;
  activeMeetings: Booking[];
  upcomingMeetings: Booking[];
  roomStatuses: RoomStatusInfo[];
  freeRoomCount: number;
  busyRoomCount: number;
}

export interface BookingFormData {
  roomId: string;
  title: string;
  department: string;
  attendees: number;
  startTime: string;
  endTime: string;
  contact: string;
  phone: string;
}
