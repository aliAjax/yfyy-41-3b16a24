import { create } from 'zustand';
import { Booking, ViewMode, BookingFormData, MeetingRoom } from '../types';
import { MEETING_ROOMS } from '../constants';
import { getBookingsFromStorage, saveBookingsToStorage } from '../utils/storage';
import { generateId, hasConflict } from '../utils/dateUtils';
import { ImportResult, ParsedBookingRow } from '../utils/importUtils';

interface BookingStore {
  bookings: Booking[];
  selectedRoomId: string;
  viewMode: ViewMode;
  currentDate: Date;
  selectedBooking: Booking | null;
  isModalOpen: boolean;
  prefilledFormData: Partial<BookingFormData> | null;
  selectedDepartment: string;
  isBatchImportModalOpen: boolean;

  setSelectedRoomId: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentDate: (date: Date) => void;
  setSelectedBooking: (booking: Booking | null) => void;
  setIsModalOpen: (open: boolean) => void;
  setPrefilledFormData: (data: Partial<BookingFormData> | null) => void;
  setSelectedDepartment: (department: string) => void;
  setIsBatchImportModalOpen: (open: boolean) => void;
  getDepartments: () => string[];

  addBooking: (data: BookingFormData) => { success: boolean; message: string };
  batchAddBookings: (validRows: ParsedBookingRow[]) => ImportResult;
  deleteBooking: (id: string) => void;
  checkConflict: (roomId: string, startTime: string, endTime: string, excludeId?: string) => boolean;
  findAvailableRooms: (date: string, startTime: string, endTime: string, attendees: number) => MeetingRoom[];
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: getBookingsFromStorage(),
  selectedRoomId: MEETING_ROOMS[0].id,
  viewMode: 'week',
  currentDate: new Date(),
  selectedBooking: null,
  isModalOpen: false,
  prefilledFormData: null,
  selectedDepartment: 'all',
  isBatchImportModalOpen: false,

  setSelectedRoomId: (id) => set({ selectedRoomId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),
  setPrefilledFormData: (data) => set({ prefilledFormData: data }),
  setSelectedDepartment: (department) => set({ selectedDepartment: department }),
  setIsBatchImportModalOpen: (open) => set({ isBatchImportModalOpen: open }),
  getDepartments: () => {
    const { bookings } = get();
    const departments = [...new Set(bookings.map((b) => b.department))].filter(Boolean).sort();
    return departments;
  },

  addBooking: (data) => {
    const { bookings } = get();
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);

    if (startDate >= endDate) {
      return { success: false, message: '结束时间必须晚于开始时间' };
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

  batchAddBookings: (validRows) => {
    const { bookings } = get();
    const validBookings = validRows.filter((r) => r.isValid && r.formData);

    if (validBookings.length === 0) {
      return {
        success: false,
        totalCount: validRows.length,
        successCount: 0,
        failedCount: validRows.length,
        message: '没有有效的预定数据可导入',
      };
    }

    const hasInvalid = validRows.some((r) => !r.isValid);
    if (hasInvalid) {
      return {
        success: false,
        totalCount: validRows.length,
        successCount: validBookings.length,
        failedCount: validRows.length - validBookings.length,
        message: '存在校验不通过的行，请修正后再导入',
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
      totalCount: validRows.length,
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
    const { bookings } = get();
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    return MEETING_ROOMS.filter((room) => {
      if (room.capacity < attendees) return false;
      return !hasConflict(bookings, room.id, startDateTime, endDateTime);
    });
  },
}));
