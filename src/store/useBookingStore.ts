import { create } from 'zustand';
import {
  Booking,
  ViewMode,
  BookingFormData,
  MeetingRoom,
  SavedView,
  RoomRecommendation,
  AdjacentTimeSlot,
  RoomFinderResult,
  CapacityMatchLevel,
  FacilityType,
  RecurrenceType,
  BookingConflictInfo,
  RecurrenceBookingResult,
} from '../types';
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
import { generateId, hasConflict, generateRecurrenceDates, getRecurrenceBookings, formatDateToLocalString } from '../utils/dateUtils';
import { ImportResult, ParsedBookingRow, validateParsedRows } from '../utils/importUtils';
import {
  ADJACENT_SEARCH_STEP_MINUTES,
  ADJACENT_MAX_SEARCH_STEPS,
  CAPACITY_MATCH_PERFECT_RATIO,
  CAPACITY_MATCH_GOOD_RATIO,
  CAPACITY_MATCH_LARGE_RATIO,
} from '../constants';

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
  findAvailableRooms: (date: string, startTime: string, endTime: string, attendees: number, facilities?: FacilityType[]) => RoomFinderResult;

  checkRecurrenceConflicts: (roomId: string, startDate: string, endDate: string, startTime: string, endTime: string, type: RecurrenceType, excludeRecurrenceId?: string) => BookingConflictInfo[];
  addRecurringBookings: (data: BookingFormData, type: RecurrenceType, recurrenceEndDate: string, skipConflicts?: boolean) => RecurrenceBookingResult;
  deleteRecurrenceSeries: (recurrenceId: string) => { success: boolean; deletedCount: number; message: string };
  updateRecurrenceSeries: (recurrenceId: string, data: BookingFormData, skipConflicts?: boolean) => RecurrenceBookingResult;
  getRecurrenceBookings: (recurrenceId: string) => Booking[];
  getCapacityMatchInfo: (roomCapacity: number, attendees: number) => { level: CapacityMatchLevel; text: string; diff: number };

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

  checkRecurrenceConflicts: (roomId, startDate, endDate, startTime, endTime, type, excludeRecurrenceId) => {
    const { bookings } = get();
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    const dates = generateRecurrenceDates(start, end, type);

    return dates.map((date) => {
      const dateStr = formatDateToLocalString(date);
      const startDateTime = new Date(`${dateStr}T${startTime}:00`);
      const endDateTime = new Date(`${dateStr}T${endTime}:00`);

      const conflictBooking = bookings.find((b) => {
        if (b.roomId !== roomId) return false;
        if (excludeRecurrenceId && b.recurrenceId === excludeRecurrenceId) return false;
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return startDateTime < bEnd && endDateTime > bStart;
      });

      return {
        date: dateStr,
        startTime,
        endTime,
        hasConflict: !!conflictBooking,
        conflictWith: conflictBooking,
      };
    });
  },

  addRecurringBookings: (data, type, recurrenceEndDate, skipConflicts = false) => {
    const { bookings, getRoomById } = get();
    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(data.endTime);
    const recurEndDate = new Date(recurrenceEndDate);
    const room = getRoomById(data.roomId);

    if (!room) {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: '会议室不存在' };
    }
    if (room.status === 'inactive') {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: '该会议室已停用，无法新建预定' };
    }
    if (data.attendees > room.capacity) {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: `参会人数超出会议室容量（最多${room.capacity}人）` };
    }
    if (startDateTime >= endDateTime) {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: '结束时间必须晚于开始时间' };
    }
    if (recurEndDate < startDateTime) {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: '重复结束日期不能早于开始日期' };
    }

    const startTimeStr = `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`;
    const endTimeStr = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;

    const startDateStr = formatDateToLocalString(startDateTime);

    const conflictInfos = get().checkRecurrenceConflicts(
      data.roomId,
      startDateStr,
      recurrenceEndDate,
      startTimeStr,
      endTimeStr,
      type
    );

    const totalCount = conflictInfos.length;
    const conflictCount = conflictInfos.filter((c) => c.hasConflict).length;

    if (totalCount === 0) {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: '没有有效的预定日期' };
    }

    if (!skipConflicts && conflictCount > 0) {
      return {
        success: false,
        totalCount,
        successCount: 0,
        conflictCount,
        message: `共 ${totalCount} 场预定，其中 ${conflictCount} 场存在冲突`,
      };
    }

    const recurrenceId = `rec-${generateId()}`;
    const now = new Date().toISOString();
    let index = 0;
    const createdBookings: Booking[] = [];

    for (const info of conflictInfos) {
      if (info.hasConflict && skipConflicts) continue;

      const newBooking: Booking = {
        id: generateId(),
        roomId: data.roomId,
        title: data.title,
        department: data.department,
        attendees: data.attendees,
        startTime: `${info.date}T${info.startTime}:00`,
        endTime: `${info.date}T${info.endTime}:00`,
        contact: data.contact,
        phone: data.phone,
        remarks: data.remarks,
        createdAt: now,
        recurrenceId,
        recurrenceType: type,
        recurrenceEndDate,
        recurrenceIndex: index,
      };

      createdBookings.push(newBooking);
      index++;
    }

    if (createdBookings.length === 0) {
      return { success: false, totalCount, successCount: 0, conflictCount, message: '所有场次都有冲突，无法创建' };
    }

    const updatedBookings = [...bookings, ...createdBookings];
    saveBookingsToStorage(updatedBookings);
    set({ bookings: updatedBookings });

    return {
      success: true,
      totalCount,
      successCount: createdBookings.length,
      conflictCount,
      message: `成功创建 ${createdBookings.length} 场重复预定${skipConflicts && conflictCount > 0 ? `（跳过 ${conflictCount} 场冲突）` : ''}`,
      createdBookings,
    };
  },

  deleteRecurrenceSeries: (recurrenceId) => {
    const { bookings } = get();
    const seriesBookings = bookings.filter((b) => b.recurrenceId === recurrenceId);
    const deletedCount = seriesBookings.length;

    if (deletedCount === 0) {
      return { success: false, deletedCount: 0, message: '未找到重复预订系列' };
    }

    const updatedBookings = bookings.filter((b) => b.recurrenceId !== recurrenceId);
    saveBookingsToStorage(updatedBookings);
    set({ bookings: updatedBookings, selectedBooking: null, isModalOpen: false });

    return { success: true, deletedCount, message: `成功取消 ${deletedCount} 场重复预定` };
  },

  updateRecurrenceSeries: (recurrenceId, data, skipConflicts = false) => {
    const { bookings, getRoomById } = get();
    const room = getRoomById(data.roomId);
    const existingSeries = bookings.filter((b) => b.recurrenceId === recurrenceId);

    if (existingSeries.length === 0) {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: '未找到重复预订系列' };
    }

    if (!room) {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: '会议室不存在' };
    }
    if (room.status === 'inactive') {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: '该会议室已停用' };
    }
    if (data.attendees > room.capacity) {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: `参会人数超出会议室容量（最多${room.capacity}人）` };
    }

    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(data.endTime);
    const recurrenceEndDate = existingSeries[0].recurrenceEndDate || formatDateToLocalString(startDateTime);
    const recurEndDate = new Date(recurrenceEndDate);
    const type = existingSeries[0].recurrenceType || 'daily';

    if (startDateTime >= endDateTime) {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: '结束时间必须晚于开始时间' };
    }
    if (recurEndDate < startDateTime) {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: '重复结束日期不能早于开始日期' };
    }

    const startTimeStr = `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`;
    const endTimeStr = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;
    const startDateStr = formatDateToLocalString(startDateTime);

    const conflictInfos = get().checkRecurrenceConflicts(
      data.roomId,
      startDateStr,
      recurrenceEndDate,
      startTimeStr,
      endTimeStr,
      type,
      recurrenceId
    );

    const totalCount = conflictInfos.length;
    const conflictCount = conflictInfos.filter((c) => c.hasConflict).length;

    if (totalCount === 0) {
      return { success: false, totalCount: 0, successCount: 0, conflictCount: 0, message: '没有有效的预定日期' };
    }

    if (!skipConflicts && conflictCount > 0) {
      return {
        success: false,
        totalCount,
        successCount: 0,
        conflictCount,
        message: `共 ${totalCount} 场预定，其中 ${conflictCount} 场存在冲突`,
      };
    }

    const now = new Date().toISOString();
    let index = 0;
    const updatedBookingsList: Booking[] = [];
    const bookingsWithoutOldSeries = bookings.filter((b) => b.recurrenceId !== recurrenceId);

    for (const info of conflictInfos) {
      if (info.hasConflict && skipConflicts) continue;

      const existingBooking = existingSeries[index];
      const newBooking: Booking = {
        id: existingBooking ? existingBooking.id : generateId(),
        roomId: data.roomId,
        title: data.title,
        department: data.department,
        attendees: data.attendees,
        startTime: `${info.date}T${info.startTime}:00`,
        endTime: `${info.date}T${info.endTime}:00`,
        contact: data.contact,
        phone: data.phone,
        remarks: data.remarks,
        createdAt: existingBooking ? existingBooking.createdAt : now,
        recurrenceId,
        recurrenceType: type,
        recurrenceEndDate,
        recurrenceIndex: index,
      };

      updatedBookingsList.push(newBooking);
      index++;
    }

    if (updatedBookingsList.length === 0) {
      return { success: false, totalCount, successCount: 0, conflictCount, message: '所有场次都有冲突，无法更新' };
    }

    const finalBookings = [...bookingsWithoutOldSeries, ...updatedBookingsList];
    saveBookingsToStorage(finalBookings);
    set({ bookings: finalBookings });

    return {
      success: true,
      totalCount,
      successCount: updatedBookingsList.length,
      conflictCount,
      message: `成功更新 ${updatedBookingsList.length} 场重复预定${skipConflicts && conflictCount > 0 ? `（跳过 ${conflictCount} 场冲突）` : ''}`,
      createdBookings: updatedBookingsList,
    };
  },

  getRecurrenceBookings: (recurrenceId) => {
    const { bookings } = get();
    return getRecurrenceBookings(bookings, recurrenceId);
  },

  checkConflict: (roomId, startTime, endTime, excludeId) => {
    const { bookings } = get();
    return hasConflict(bookings, roomId, new Date(startTime), new Date(endTime), excludeId);
  },

  findAvailableRooms: (date, startTime, endTime, attendees, facilities = []) => {
    const { bookings, getActiveRooms, getCapacityMatchInfo } = get();
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);
    const activeRooms = getActiveRooms();

    const meetsFacilityRequirement = (room: MeetingRoom) => {
      if (facilities.length === 0) return true;
      const roomFacilities = room.facilities || [];
      return facilities.every((f) => roomFacilities.includes(f));
    };

    const availableRooms = activeRooms.filter((room) => {
      if (room.capacity < attendees) return false;
      if (!meetsFacilityRequirement(room)) return false;
      return !hasConflict(bookings, room.id, startDateTime, endDateTime);
    });

    const recommendations: RoomRecommendation[] = availableRooms.map((room) => {
      const matchInfo = getCapacityMatchInfo(room.capacity, attendees);
      return {
        room,
        capacityMatchLevel: matchInfo.level,
        capacityMatchText: matchInfo.text,
        capacityDiff: matchInfo.diff,
      };
    });

    recommendations.sort((a, b) => {
      const levelOrder: Record<CapacityMatchLevel, number> = {
        perfect: 0,
        good: 1,
        large: 2,
        far: 3,
      };
      if (levelOrder[a.capacityMatchLevel] !== levelOrder[b.capacityMatchLevel]) {
        return levelOrder[a.capacityMatchLevel] - levelOrder[b.capacityMatchLevel];
      }
      return a.capacityDiff - b.capacityDiff;
    });

    const adjacentSuggestions: AdjacentTimeSlot[] = [];
    if (recommendations.length === 0) {
      const roomsWithEnoughCapacity = activeRooms.filter((room) => {
        if (room.capacity < attendees) return false;
        if (!meetsFacilityRequirement(room)) return false;
        return true;
      });
      const stepMinutes = ADJACENT_SEARCH_STEP_MINUTES;
      const maxSearchSteps = ADJACENT_MAX_SEARCH_STEPS;

      for (const room of roomsWithEnoughCapacity) {
        const matchInfo = getCapacityMatchInfo(room.capacity, attendees);

        for (const direction of ['earlier', 'later'] as const) {
          for (let step = 1; step <= maxSearchSteps; step++) {
            const offsetMs = direction === 'earlier'
              ? -step * stepMinutes * 60 * 1000
              : step * stepMinutes * 60 * 1000;
            const candidateStart = new Date(startDateTime.getTime() + offsetMs);
            const candidateEnd = new Date(endDateTime.getTime() + offsetMs);

            const dayStart = new Date(`${date}T00:00:00`);
            const dayEnd = new Date(`${date}T23:59:59`);
            if (candidateStart < dayStart || candidateEnd > dayEnd) continue;

            if (!hasConflict(bookings, room.id, candidateStart, candidateEnd)) {
              const formatTime = (d: Date) => {
                const h = d.getHours().toString().padStart(2, '0');
                const m = d.getMinutes().toString().padStart(2, '0');
                return `${h}:${m}`;
              };
              adjacentSuggestions.push({
                room,
                startTime: formatTime(candidateStart),
                endTime: formatTime(candidateEnd),
                direction,
                timeDiffMinutes: step * stepMinutes,
                capacityMatchLevel: matchInfo.level,
                capacityMatchText: matchInfo.text,
              });
              break;
            }
          }
        }
      }

      adjacentSuggestions.sort((a, b) => {
        if (a.timeDiffMinutes !== b.timeDiffMinutes) {
          return a.timeDiffMinutes - b.timeDiffMinutes;
        }
        const levelOrder: Record<CapacityMatchLevel, number> = {
          perfect: 0,
          good: 1,
          large: 2,
          far: 3,
        };
        return levelOrder[a.capacityMatchLevel] - levelOrder[b.capacityMatchLevel];
      });
    }

    return { recommendations, adjacentSuggestions };
  },

  getCapacityMatchInfo: (roomCapacity, attendees) => {
    const diff = roomCapacity - attendees;
    const ratio = attendees / roomCapacity;

    if (diff === 0 || ratio >= CAPACITY_MATCH_PERFECT_RATIO) {
      return { level: 'perfect' as CapacityMatchLevel, text: '刚好合适', diff };
    } else if (ratio >= CAPACITY_MATCH_GOOD_RATIO) {
      return { level: 'good' as CapacityMatchLevel, text: '容量适中', diff };
    } else if (ratio >= CAPACITY_MATCH_LARGE_RATIO) {
      return { level: 'large' as CapacityMatchLevel, text: '容量偏大', diff };
    } else {
      return { level: 'far' as CapacityMatchLevel, text: '距离当前选择较远', diff };
    }
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
