import { MeetingRoom, FacilityInfo } from '../types';

export const FACILITY_LIST: FacilityInfo[] = [
  { type: 'projector', label: '投影', icon: 'projector' },
  { type: 'video_conference', label: '视频会议', icon: 'video' },
  { type: 'whiteboard', label: '白板', icon: 'square' },
  { type: 'phone_conference', label: '电话会议', icon: 'phone' },
];

export const DEFAULT_MEETING_ROOMS: MeetingRoom[] = [
  {
    id: 'room-1',
    name: '大会议室',
    capacity: 50,
    location: '3楼',
    color: '#3b82f6',
    status: 'active',
    facilities: ['projector', 'video_conference', 'whiteboard', 'phone_conference'],
  },
  {
    id: 'room-2',
    name: '中会议室',
    capacity: 20,
    location: '2楼',
    color: '#10b981',
    status: 'active',
    facilities: ['projector', 'whiteboard'],
  },
  {
    id: 'room-3',
    name: '小会议室',
    capacity: 8,
    location: '2楼',
    color: '#f59e0b',
    status: 'active',
    facilities: ['whiteboard', 'phone_conference'],
  },
  {
    id: 'room-4',
    name: '洽谈室',
    capacity: 6,
    location: '1楼',
    color: '#8b5cf6',
    status: 'active',
    facilities: ['whiteboard'],
  },
];

export const STORAGE_KEYS = {
  BOOKINGS: 'meeting_room_bookings',
  TEMPLATES: 'meeting_room_templates',
  ROOMS: 'meeting_rooms_data',
  VIEWS: 'meeting_room_saved_views',
};

export const BUSINESS_START_HOUR = 8;
export const BUSINESS_END_HOUR = 20;
export const HOUR_HEIGHT = 60;

export const ADJACENT_SEARCH_STEP_MINUTES = 30;
export const ADJACENT_MAX_SEARCH_STEPS = 24;

export const CAPACITY_MATCH_PERFECT_RATIO = 0.95;
export const CAPACITY_MATCH_GOOD_RATIO = 0.7;
export const CAPACITY_MATCH_LARGE_RATIO = 0.4;
