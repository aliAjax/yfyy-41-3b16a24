import { Booking, BookingTemplate, MeetingRoom, SavedView, BookingChangeLog, RoomChangeLog } from '../types';
import { STORAGE_KEYS, DEFAULT_MEETING_ROOMS } from '../constants';

export function getBookingsFromStorage(): Booking[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!data) return [];
    const bookings: Booking[] = JSON.parse(data);
    return bookings.map((booking) => ({
      ...booking,
      remarks: booking.remarks ?? '',
    }));
  } catch (error) {
    console.error('Failed to load bookings from storage:', error);
    return [];
  }
}

export function saveBookingsToStorage(bookings: Booking[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch (error) {
    console.error('Failed to save bookings to storage:', error);
  }
}

export function updateBookingInStorage(id: string, updates: Partial<Omit<Booking, 'id' | 'createdAt'>>): Booking | null {
  const bookings = getBookingsFromStorage();
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;
  bookings[index] = { ...bookings[index], ...updates };
  saveBookingsToStorage(bookings);
  return bookings[index];
}

export function getTemplatesFromStorage(): BookingTemplate[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!data) return [];
    const templates: BookingTemplate[] = JSON.parse(data);
    return templates.map((template) => ({
      ...template,
      remarks: template.remarks ?? '',
    }));
  } catch (error) {
    console.error('Failed to load templates from storage:', error);
    return [];
  }
}

export function saveTemplatesToStorage(templates: BookingTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (error) {
    console.error('Failed to save templates to storage:', error);
  }
}

export function addTemplateToStorage(template: Omit<BookingTemplate, 'id' | 'createdAt'>): BookingTemplate {
  const templates = getTemplatesFromStorage();
  const newTemplate: BookingTemplate = {
    ...template,
    id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  saveTemplatesToStorage(templates);
  return newTemplate;
}

export function deleteTemplateFromStorage(id: string): void {
  const templates = getTemplatesFromStorage();
  const filtered = templates.filter((t) => t.id !== id);
  saveTemplatesToStorage(filtered);
}

export function getRoomsFromStorage(): MeetingRoom[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (!data) {
      saveRoomsToStorage(DEFAULT_MEETING_ROOMS);
      return DEFAULT_MEETING_ROOMS;
    }
    const rooms: MeetingRoom[] = JSON.parse(data);
    return rooms.map((room) => ({
      ...room,
      facilities: room.facilities ?? [],
    }));
  } catch (error) {
    console.error('Failed to load rooms from storage:', error);
    return DEFAULT_MEETING_ROOMS;
  }
}

export function saveRoomsToStorage(rooms: MeetingRoom[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  } catch (error) {
    console.error('Failed to save rooms to storage:', error);
  }
}

export function addRoomToStorage(room: Omit<MeetingRoom, 'id' | 'status'>): MeetingRoom {
  const rooms = getRoomsFromStorage();
  const newRoom: MeetingRoom = {
    ...room,
    id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'active',
  };
  rooms.push(newRoom);
  saveRoomsToStorage(rooms);
  return newRoom;
}

export function updateRoomInStorage(id: string, updates: Partial<Omit<MeetingRoom, 'id'>>): MeetingRoom | null {
  const rooms = getRoomsFromStorage();
  const index = rooms.findIndex((r) => r.id === id);
  if (index === -1) return null;
  rooms[index] = { ...rooms[index], ...updates };
  saveRoomsToStorage(rooms);
  return rooms[index];
}

export function toggleRoomStatusInStorage(id: string): MeetingRoom | null {
  const rooms = getRoomsFromStorage();
  const room = rooms.find((r) => r.id === id);
  if (!room) return null;
  const newStatus = room.status === 'active' ? 'inactive' : 'active';
  return updateRoomInStorage(id, { status: newStatus });
}

export function deleteRoomFromStorage(id: string): boolean {
  const rooms = getRoomsFromStorage();
  const filtered = rooms.filter((r) => r.id !== id);
  if (filtered.length === rooms.length) return false;
  saveRoomsToStorage(filtered);
  return true;
}

export function getActiveRoomsFromStorage(): MeetingRoom[] {
  return getRoomsFromStorage().filter((r) => r.status === 'active');
}

export function getViewsFromStorage(): SavedView[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VIEWS);
    if (!data) return [];
    const views: SavedView[] = JSON.parse(data);
    return views;
  } catch (error) {
    console.error('Failed to load views from storage:', error);
    return [];
  }
}

export function saveViewsToStorage(views: SavedView[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(views));
  } catch (error) {
    console.error('Failed to save views to storage:', error);
  }
}

export function addViewToStorage(view: Omit<SavedView, 'id' | 'createdAt'>): SavedView {
  const views = getViewsFromStorage();
  const newView: SavedView = {
    ...view,
    id: `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  views.push(newView);
  saveViewsToStorage(views);
  return newView;
}

export function deleteViewFromStorage(id: string): boolean {
  const views = getViewsFromStorage();
  const filtered = views.filter((v) => v.id !== id);
  if (filtered.length === views.length) return false;
  saveViewsToStorage(filtered);
  return true;
}

export function updateViewInStorage(id: string, updates: Partial<Omit<SavedView, 'id' | 'createdAt'>>): SavedView | null {
  const views = getViewsFromStorage();
  const index = views.findIndex((v) => v.id === id);
  if (index === -1) return null;
  views[index] = { ...views[index], ...updates };
  saveViewsToStorage(views);
  return views[index];
}

export function getBookingChangeLogsFromStorage(): BookingChangeLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKING_CHANGE_LOGS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load booking change logs from storage:', error);
    return [];
  }
}

export function saveBookingChangeLogsToStorage(logs: BookingChangeLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKING_CHANGE_LOGS, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save booking change logs to storage:', error);
  }
}

export function addBookingChangeLog(log: Omit<BookingChangeLog, 'id'>): BookingChangeLog {
  const logs = getBookingChangeLogsFromStorage();
  const newLog: BookingChangeLog = {
    ...log,
    id: `bcl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  logs.push(newLog);
  saveBookingChangeLogsToStorage(logs);
  return newLog;
}

export function getBookingChangeLogsByBookingId(bookingId: string): BookingChangeLog[] {
  const logs = getBookingChangeLogsFromStorage();
  return logs
    .filter((log) => log.bookingId === bookingId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getRoomChangeLogsFromStorage(): RoomChangeLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ROOM_CHANGE_LOGS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load room change logs from storage:', error);
    return [];
  }
}

export function saveRoomChangeLogsToStorage(logs: RoomChangeLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROOM_CHANGE_LOGS, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save room change logs to storage:', error);
  }
}

export function addRoomChangeLog(log: Omit<RoomChangeLog, 'id'>): RoomChangeLog {
  const logs = getRoomChangeLogsFromStorage();
  const newLog: RoomChangeLog = {
    ...log,
    id: `rcl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  logs.push(newLog);
  saveRoomChangeLogsToStorage(logs);
  return newLog;
}

export function getRoomChangeLogsByRoomId(roomId: string): RoomChangeLog[] {
  const logs = getRoomChangeLogsFromStorage();
  return logs
    .filter((log) => log.roomId === roomId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
