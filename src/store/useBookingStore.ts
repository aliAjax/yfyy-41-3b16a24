import { create } from 'zustand';
import { Booking, ViewMode, BookingFormData, MeetingRoom, SavedView } from '../types';
import {
  getBookingsFromStorage,
  saveBookingsToStorage,
  getRoomsFromStorage,
  addRoomToStorage,
  updateRoomInStorage,
  toggleRoomStatusInStorage,
  deleteRoomFromStorage,
  updateBookingInStorage,
  getViewsFromStorage,
  addViewToStorage,
  deleteViewFromStorage,
} from '../utils/storage';
import { generateId, hasConflict } from '../utils/dateUtils';
import { ImportResult, ParsedBookingRow, validateParsedRows } from '../utils/importUtils';

interface BookingStore {
  bookings: Booking[];
  rooms: MeetingRoom[];
  selectedRoomId: string;
  viewMode: ViewMode;
  currentDate: Date;
  selectedBooking: Booking | null;
  isModalOpen: boolean;
  prefilledFormData: Partial<BookingFormData> | null;
  selectedDepartment: string;
  isBatchImportModalOpen: boolean;
  isRoomManagementModalOpen: boolean;
  savedViews: SavedView[];
  isSaveViewModalOpen: boolean;
  activeViewId: string | null;

  setSelectedRoomId: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentDate: (date: Date) => void;
  setSelectedBooking: (booking: Booking | null) => void;
  setIsModalOpen: (open: boolean) => void;
  setPrefilledFormData: (data: Partial<BookingFormData> | null) => void;
  setSelectedDepartment: (department: string) => void;
  setIsBatchImportModalOpen: (open: boolean) => void;
  setIsRoomManagementModalOpen: (open: boolean) => void;
  setIsSaveViewModalOpen: (open: boolean) => void;
  setActiveViewId: (id: string | null) => void;
  getDepartments: () => string[];
  getActiveRooms: () => MeetingRoom[];
  getRoomById: (id: string) => MeetingRoom | undefined;
  hasBookingsForRoom: (roomId: string) => boolean;
  addSavedView: (name: string) => SavedView;
  deleteSavedView: (id: string) => void;
  applyView: (view: SavedView) => void;
  refreshViews: () => void;

  addBooking: (data: BookingFormData) => { success: boolean; message: string };
  updateBooking: (id: string, data: BookingFormData) => { success: boolean; message: string };
  batchAddBookings: (validRows: ParsedBookingRow[]) => ImportResult;
  deleteBooking: (id: string) => void;
  checkConflict: (roomId: string, startTime: string, endTime: string, excludeId?: string) => boolean;
  findAvailableRooms: (date: string, startTime: string, endTime: string, attendees: number) => MeetingRoom[];

  addRoom: (room: Omit<MeetingRoom, 'id' | 'status'>) => MeetingRoom;
  updateRoom: (id: string, updates: Partial<Omit<MeetingRoom, 'id'>>) => MeetingRoom | null;
  toggleRoomStatus: (id: string) => MeetingRoom | null;
  deleteRoom: (id: string) => { success: boolean; message: string };
  refreshRooms: () => void;
}

export const useBookingStore = create<BookingStore>((set, get) => {
  const initialRooms = getRoomsFromStorage();
  const firstActiveRoom = initialRooms.find((r) => r.status === 'active') || initialRooms[0];

  return {
    bookings: getBookingsFromStorage(),
    rooms: initialRooms,
    selectedRoomId: firstActiveRoom?.id || '',
    viewMode: 'week',
    currentDate: new Date(),
    selectedBooking: null,
    isModalOpen: false,
    prefilledFormData: null,
    selectedDepartment: 'all',
    isBatchImportModalOpen: false,
    isRoomManagementModalOpen: false,
    savedViews: getViewsFromStorage(),
    isSaveViewModalOpen: false,
    activeViewId: null,

    setSelectedRoomId: (id) => set({ selectedRoomId: id, activeViewId: null }),
    setViewMode: (mode) => set({ viewMode: mode, activeViewId: null }),
    setCurrentDate: (date) => set({ currentDate: date, activeViewId: null }),
    setSelectedBooking: (booking) => set({ selectedBooking: booking }),
    setIsModalOpen: (open) => set({ isModalOpen: open }),
    setPrefilledFormData: (data) => set({ prefilledFormData: data }),
    setSelectedDepartment: (department) => set({ selectedDepartment: department, activeViewId: null }),
    setIsBatchImportModalOpen: (open) => set({ isBatchImportModalOpen: open }),
    setIsRoomManagementModalOpen: (open) => set({ isRoomManagementModalOpen: open }),
    setIsSaveViewModalOpen: (open) => set({ isSaveViewModalOpen: open }),
    setActiveViewId: (id) => set({ activeViewId: id }),
    getDepartments: () => {
      const { bookings } = get();
      const departments = [...new Set(bookings.map((b) => b.department))].filter(Boolean).sort();
      return departments;
    },
    getActiveRooms: () => {
      const { rooms } = get();
      return rooms.filter((r) => r.status === 'active');
    },
    getRoomById: (id) => {
      const { rooms } = get();
      return rooms.find((r) => r.id === id);
    },
    hasBookingsForRoom: (roomId) => {
      const { bookings } = get();
      return bookings.some((b) => b.roomId === roomId);
    },
    addSavedView: (name) => {
      const { selectedRoomId, viewMode, currentDate, selectedDepartment } = get();
      const newView = addViewToStorage({
        name,
        roomId: selectedRoomId,
        viewMode,
        currentDate: currentDate.toISOString(),
        selectedDepartment,
      });
      const savedViews = getViewsFromStorage();
      set({ savedViews, isSaveViewModalOpen: false, activeViewId: newView.id });
      return newView;
    },
    deleteSavedView: (id) => {
      deleteViewFromStorage(id);
      const savedViews = getViewsFromStorage();
      const { activeViewId } = get();
      set({ savedViews, activeViewId: activeViewId === id ? null : activeViewId });
    },
    applyView: (view) => {
      set({
        selectedRoomId: view.roomId,
        viewMode: view.viewMode,
        currentDate: new Date(view.currentDate),
        selectedDepartment: view.selectedDepartment,
        activeViewId: view.id,
      });
    },
    refreshViews: () => {
      const savedViews = getViewsFromStorage();
      set({ savedViews });
    },

  addBooking: (data) => {
    const { bookings, getRoomById } = get();
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);

    if (startDate >= endDate) {
      return { success: false, message: '结束时间必须晚于开始时间' };
    }

    const room = getRoomById(data.roomId);
    if (!room) {
      return { success: false, message: '会议室不存在' };
    }
    if (room.status === 'inactive') {
      return { success: false, message: '该会议室已停用，无法新建预定' };
    }
    if (data.attendees > room.capacity) {
      return { success: false, message: `参会人数超出会议室容量（最多${room.capacity}人）` };
    }

    if (hasConflict(bookings, data.roomId, startDate, endDate)) {
      return { success: false, message: '该时间段已有会议预定，请选择其他时间' };
    }

    const newBooking: Booking = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };

    const updatedBookings = [...bookings, newBooking];
    saveBookingsToStorage(updatedBookings);
    set({ bookings: updatedBookings });

    return { success: true, message: '预定成功！' };
  },

  updateBooking: (id, data) => {
    const { bookings, getRoomById } = get();
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);

    if (startDate >= endDate) {
      return { success: false, message: '结束时间必须晚于开始时间' };
    }

    const room = getRoomById(data.roomId);
    if (!room) {
      return { success: false, message: '会议室不存在' };
    }
    if (room.status === 'inactive') {
      return { success: false, message: '该会议室已停用，无法修改预定' };
    }

    if (data.attendees > room.capacity) {
      return { success: false, message: `参会人数超出会议室容量（最多${room.capacity}人）` };
    }

    if (hasConflict(bookings, data.roomId, startDate, endDate, id)) {
      return { success: false, message: '该时间段已有会议预定，请选择其他时间' };
    }

    const updatedBooking = updateBookingInStorage(id, {
      ...data,
    });

    if (updatedBooking) {
      const updatedBookings = getBookingsFromStorage();
      set({ bookings: updatedBookings, selectedBooking: updatedBooking });
      return { success: true, message: '修改成功！' };
    }

    return { success: false, message: '修改失败，预定不存在' };
  },

  batchAddBookings: (validRows) => {
    const { bookings, getActiveRooms } = get();
    const activeRooms = getActiveRooms();

    const rawDataRows = validRows.map((r) => r.rawData);
    const revalidated = validateParsedRows(rawDataRows, activeRooms, bookings);

    const invalidCount = revalidated.filter((r) => !r.isValid).length;
    if (invalidCount > 0) {
      return {
        success: false,
        totalCount: revalidated.length,
        successCount: revalidated.length - invalidCount,
        failedCount: invalidCount,
        message: `写入前校验发现 ${invalidCount} 条数据不合法，请刷新预览后重试`,
      };
    }

    const validBookings = revalidated.filter((r) => r.isValid && r.formData);
    if (validBookings.length === 0) {
      return {
        success: false,
        totalCount: revalidated.length,
        successCount: 0,
        failedCount: revalidated.length,
        message: '没有有效的预定数据可导入',
      };
    }

    const now = new Date().toISOString();
    const newBookings: Booking[] = validBookings.map((row) => ({
      id: generateId(),
      ...row.formData!,
      createdAt: now,
    }));

    const updatedBookings = [...bookings, ...newBookings];
    saveBookingsToStorage(updatedBookings);
    set({ bookings: updatedBookings });

    return {
      success: true,
      totalCount: revalidated.length,
      successCount: newBookings.length,
      failedCount: 0,
      bookings: newBookings,
      message: `成功导入 ${newBookings.length} 条预定`,
    };
  },

  deleteBooking: (id) => {
    const { bookings } = get();
    const updatedBookings = bookings.filter((b) => b.id !== id);
    saveBookingsToStorage(updatedBookings);
    set({ bookings: updatedBookings, selectedBooking: null, isModalOpen: false });
  },

  checkConflict: (roomId, startTime, endTime, excludeId) => {
    const { bookings } = get();
    return hasConflict(bookings, roomId, new Date(startTime), new Date(endTime), excludeId);
  },

  findAvailableRooms: (date, startTime, endTime, attendees) => {
    const { bookings, getActiveRooms } = get();
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);
    const activeRooms = getActiveRooms();

    return activeRooms.filter((room) => {
      if (room.capacity < attendees) return false;
      return !hasConflict(bookings, room.id, startDateTime, endDateTime);
    });
  },

  addRoom: (room) => {
    const newRoom = addRoomToStorage(room);
    const rooms = getRoomsFromStorage();
    set({ rooms });
    return newRoom;
  },

  updateRoom: (id, updates) => {
    const updatedRoom = updateRoomInStorage(id, updates);
    if (updatedRoom) {
      const rooms = getRoomsFromStorage();
      set({ rooms });
    }
    return updatedRoom;
  },

  toggleRoomStatus: (id) => {
    const updatedRoom = toggleRoomStatusInStorage(id);
    if (updatedRoom) {
      const rooms = getRoomsFromStorage();
      const { selectedRoomId } = get();
      set({ rooms });
      if (selectedRoomId === id && updatedRoom.status === 'inactive') {
        const firstActive = rooms.find((r) => r.status === 'active');
        if (firstActive) {
          set({ selectedRoomId: firstActive.id });
        }
      }
    }
    return updatedRoom;
  },

  deleteRoom: (id) => {
    const { hasBookingsForRoom } = get();
    if (hasBookingsForRoom(id)) {
      return { success: false, message: '该会议室存在历史预定，无法删除，建议停用' };
    }
    const success = deleteRoomFromStorage(id);
    if (success) {
      const rooms = getRoomsFromStorage();
      const { selectedRoomId } = get();
      set({ rooms });
      if (selectedRoomId === id) {
        const firstActive = rooms.find((r) => r.status === 'active');
        if (firstActive) {
          set({ selectedRoomId: firstActive.id });
        }
      }
      return { success: true, message: '删除成功' };
    }
    return { success: false, message: '删除失败' };
  },

  refreshRooms: () => {
    const rooms = getRoomsFromStorage();
    set({ rooms });
  },
};
});
