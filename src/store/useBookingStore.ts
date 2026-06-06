import { create } from 'zustand';
import { Booking, ViewMode, BookingFormData } from '../types';
import { MEETING_ROOMS } from '../constants';
import { getBookingsFromStorage, saveBookingsToStorage } from '../utils/storage';
import { generateId, hasConflict } from '../utils/dateUtils';

interface BookingStore {
  bookings: Booking[];
  selectedRoomId: string;
  viewMode: ViewMode;
  currentDate: Date;
  selectedBooking: Booking | null;
  isModalOpen: boolean;

  setSelectedRoomId: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentDate: (date: Date) => void;
  setSelectedBooking: (booking: Booking | null) => void;
  setIsModalOpen: (open: boolean) => void;

  addBooking: (data: BookingFormData) => { success: boolean; message: string };
  deleteBooking: (id: string) => void;
  checkConflict: (roomId: string, startTime: string, endTime: string, excludeId?: string) => boolean;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: getBookingsFromStorage(),
  selectedRoomId: MEETING_ROOMS[0].id,
  viewMode: 'week',
  currentDate: new Date(),
  selectedBooking: null,
  isModalOpen: false,

  setSelectedRoomId: (id) => set({ selectedRoomId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),

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
}));
