export type MeetingRoomStatus = 'active' | 'inactive';

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  location: string;
  color: string;
  status: MeetingRoomStatus;
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
  remarks?: string;
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
  remarks: string;
}

export interface BookingTemplate {
  id: string;
  name: string;
  title: string;
  department: string;
  attendees: number;
  contact: string;
  phone: string;
  remarks: string;
  createdAt: string;
}

export type CapacityMatchLevel = 'perfect' | 'good' | 'large' | 'far';

export interface RoomRecommendation {
  room: MeetingRoom;
  capacityMatchLevel: CapacityMatchLevel;
  capacityMatchText: string;
  capacityDiff: number;
}

export interface AdjacentTimeSlot {
  room: MeetingRoom;
  startTime: string;
  endTime: string;
  direction: 'earlier' | 'later';
  timeDiffMinutes: number;
  capacityMatchLevel: CapacityMatchLevel;
  capacityMatchText: string;
}

export interface RoomFinderResult {
  recommendations: RoomRecommendation[];
  adjacentSuggestions: AdjacentTimeSlot[];
}

export interface SavedView {
  id: string;
  name: string;
  roomId: string;
  viewMode: ViewMode;
  currentDate: string;
  selectedDepartment: string;
  createdAt: string;
}
