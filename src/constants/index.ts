import { MeetingRoom } from '../types';

export const DEFAULT_MEETING_ROOMS: MeetingRoom[] = [
  {
    id: 'room-1',
    name: '大会议室',
    capacity: 50,
    location: '3楼',
    color: '#3b82f6',
    status: 'active',
  },
  {
    id: 'room-2',
    name: '中会议室',
    capacity: 20,
    location: '2楼',
    color: '#10b981',
    status: 'active',
  },
  {
    id: 'room-3',
    name: '小会议室',
    capacity: 8,
    location: '2楼',
    color: '#f59e0b',
    status: 'active',
  },
  {
    id: 'room-4',
    name: '洽谈室',
    capacity: 6,
    location: '1楼',
    color: '#8b5cf6',
    status: 'active',
  },
];

export const STORAGE_KEYS = {
  BOOKINGS: 'meeting_room_bookings',
  TEMPLATES: 'meeting_room_templates',
  ROOMS: 'meeting_rooms_data',
};

export const BUSINESS_START_HOUR = 8;
export const BUSINESS_END_HOUR = 20;
export const HOUR_HEIGHT = 60;
