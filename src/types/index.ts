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
