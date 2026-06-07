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
  BookingChangeLog,
  RoomChangeLog,
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
  addBookingChangeLog,
  getBookingChangeLogsByBookingId,
  addRoomChangeLog,
  getRoomChangeLogsByRoomId,
} from '../utils/storage';
import { generateId, hasConflict, getRecurrenceBookings, formatDateToLocalString } from '../utils/dateUtils';
import { ImportResult, ParsedBookingRow, validateParsedRows } from '../utils/importUtils';
import {
  buildBookingCreateChanges,
  buildBookingUpdateChanges,
  buildRecurrenceBookingUpdateChanges,
  buildBookingCancelChanges,
  buildRoomCreateChanges,
  buildRoomUpdateChanges,
  buildRoomStatusChanges,
} from '../utils/changeLogUtils';
import {
  validateRecurrenceCreateInput,
  validateRecurrenceUpdateInput,
  getTimeStrings,
  getRecurrenceConflictInfos,
  buildRecurrenceConflictResult,
  buildRecurrenceBookings,
  buildUpdatedRecurrenceBookings,
  buildRecurrenceSuccessResult,
  buildRecurrenceErrorResult,
} from '../utils/recurrenceUtils';
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

  getBookingChangeLogs: (bookingId: string) => BookingChangeLog[];
  getRoomChangeLogs: (roomId: string) => RoomChangeLog[];
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

    addBookingChangeLog({
      bookingId: newBooking.id,
      type: 'create',
      timestamp: new Date().toISOString(),
      changes: buildBookingCreateChanges(data, room.name),
      description: '新建预订',
    });

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

    const oldBooking = bookings.find((b) => b.id === id);
    const oldRoom = oldBooking ? getRoomById(oldBooking.roomId) : undefined;

    const updatedBooking = updateBookingInStorage(id, {
      ...data,
    });

    if (updatedBooking) {
      const updatedBookings = getBookingsFromStorage();
      set({ bookings: updatedBookings, selectedBooking: updatedBooking });

      const changes = buildBookingUpdateChanges(oldBooking, data, oldRoom?.name, room.name);

      addBookingChangeLog({
        bookingId: id,
        type: 'update',
        timestamp: new Date().toISOString(),
        changes,
        description: '修改预订',
      });

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
    const booking = bookings.find((b) => b.id === id);
    const updatedBookings = bookings.filter((b) => b.id !== id);
    saveBookingsToStorage(updatedBookings);
    set({ bookings: updatedBookings, selectedBooking: null, isModalOpen: false });

    if (booking) {
      addBookingChangeLog({
        bookingId: id,
        type: 'cancel',
        timestamp: new Date().toISOString(),
        changes: buildBookingCancelChanges(),
        description: '取消预订',
      });
    }
  },

  checkRecurrenceConflicts: (roomId, startDate, endDate, startTime, endTime, type, excludeRecurrenceId) => {
    const { bookings } = get();
    return getRecurrenceConflictInfos(
      bookings,
      roomId,
      startDate,
      endDate,
      startTime,
      endTime,
      type,
      excludeRecurrenceId
    );
  },

  addRecurringBookings: (data, type, recurrenceEndDate, skipConflicts = false) => {
    const { bookings, getRoomById } = get();
    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(data.endTime);
    const startDateStr = formatDateToLocalString(startDateTime);
    const room = getRoomById(data.roomId);

    const validation = validateRecurrenceCreateInput(data, room, recurrenceEndDate);
    if (!validation.valid) {
      return buildRecurrenceErrorResult(0, 0, validation.message);
    }

    const { startTimeStr, endTimeStr } = getTimeStrings(startDateTime, endDateTime);
    const conflictInfos = getRecurrenceConflictInfos(
      bookings,
      data.roomId,
      startDateStr,
      recurrenceEndDate,
      startTimeStr,
      endTimeStr,
      type
    );

    const conflictResult = buildRecurrenceConflictResult(conflictInfos, skipConflicts);
    if (!conflictResult.canProceed) {
      return buildRecurrenceErrorResult(conflictResult.totalCount, conflictResult.conflictCount, conflictResult.message);
    }

    const recurrenceId = `rec-${generateId()}`;
    const now = new Date().toISOString();
    const createdBookings = buildRecurrenceBookings(
      data,
      conflictInfos,
      type,
      recurrenceEndDate,
      recurrenceId,
      now,
      skipConflicts
    );

    if (createdBookings.length === 0) {
      return buildRecurrenceErrorResult(conflictResult.totalCount, conflictResult.conflictCount, '所有场次都有冲突，无法创建');
    }

    const updatedBookings = [...bookings, ...createdBookings];
    saveBookingsToStorage(updatedBookings);
    set({ bookings: updatedBookings });

    const roomName = room!.name;
    for (const booking of createdBookings) {
      addBookingChangeLog({
        bookingId: booking.id,
        type: 'create',
        timestamp: now,
        changes: buildBookingCreateChanges(data, roomName, recurrenceId),
        description: '新建重复预订',
      });
    }

    return buildRecurrenceSuccessResult(
      conflictResult.totalCount,
      createdBookings.length,
      conflictResult.conflictCount,
      createdBookings,
      skipConflicts,
      'create'
    );
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

    const now = new Date().toISOString();
    for (const booking of seriesBookings) {
      addBookingChangeLog({
        bookingId: booking.id,
        type: 'cancel',
        timestamp: now,
        changes: buildBookingCancelChanges(),
        description: '取消重复预订系列',
      });
    }

    return { success: true, deletedCount, message: `成功取消 ${deletedCount} 场重复预定` };
  },

  updateRecurrenceSeries: (recurrenceId, data, skipConflicts = false) => {
    const { bookings, getRoomById } = get();
    const room = getRoomById(data.roomId);
    const existingSeries = bookings.filter((b) => b.recurrenceId === recurrenceId);
    const type = existingSeries[0]?.recurrenceType || 'daily';
    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(data.endTime);
    const recurrenceEndDate = existingSeries[0]?.recurrenceEndDate || formatDateToLocalString(startDateTime);

    const validation = validateRecurrenceUpdateInput(data, room, existingSeries, recurrenceEndDate);
    if (!validation.valid) {
      return buildRecurrenceErrorResult(0, 0, validation.message);
    }

    const startDateStr = formatDateToLocalString(startDateTime);
    const { startTimeStr, endTimeStr } = getTimeStrings(startDateTime, endDateTime);
    const conflictInfos = getRecurrenceConflictInfos(
      bookings,
      data.roomId,
      startDateStr,
      recurrenceEndDate,
      startTimeStr,
      endTimeStr,
      type,
      recurrenceId
    );

    const conflictResult = buildRecurrenceConflictResult(conflictInfos, skipConflicts);
    if (!conflictResult.canProceed) {
      return buildRecurrenceErrorResult(conflictResult.totalCount, conflictResult.conflictCount, conflictResult.message);
    }

    const now = new Date().toISOString();
    const updatedBookingsList = buildUpdatedRecurrenceBookings(
      data,
      conflictInfos,
      type,
      recurrenceEndDate,
      recurrenceId,
      now,
      existingSeries,
      skipConflicts
    );

    if (updatedBookingsList.length === 0) {
      return buildRecurrenceErrorResult(conflictResult.totalCount, conflictResult.conflictCount, '所有场次都有冲突，无法更新');
    }

    const bookingsWithoutOldSeries = bookings.filter((b) => b.recurrenceId !== recurrenceId);
    const finalBookings = [...bookingsWithoutOldSeries, ...updatedBookingsList];
    saveBookingsToStorage(finalBookings);
    set({ bookings: finalBookings });

    const oldFirstBooking = existingSeries[0];
    const roomName = room!.name;
    const oldRoom = oldFirstBooking ? getRoomById(oldFirstBooking.roomId) : undefined;
    const oldRoomName = oldRoom?.name;

    for (let i = 0; i < updatedBookingsList.length; i++) {
      const newBooking = updatedBookingsList[i];
      const oldBooking = existingSeries[i];

      const changes = buildRecurrenceBookingUpdateChanges(
        oldBooking,
        data,
        newBooking.startTime,
        newBooking.endTime,
        oldRoomName,
        roomName
      );

      addBookingChangeLog({
        bookingId: newBooking.id,
        type: 'update',
        timestamp: now,
        changes,
        description: '修改重复预订系列',
      });
    }

    return buildRecurrenceSuccessResult(
      conflictResult.totalCount,
      updatedBookingsList.length,
      conflictResult.conflictCount,
      updatedBookingsList,
      skipConflicts,
      'update'
    );
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

    addRoomChangeLog({
      roomId: newRoom.id,
      type: 'create',
      timestamp: new Date().toISOString(),
      changes: buildRoomCreateChanges(room),
      description: '新增会议室',
    });

    return newRoom;
  },

  updateRoom: (id, updates) => {
    const { rooms } = get();
    const oldRoom = rooms.find((r) => r.id === id);
    const updatedRoom = updateRoomInStorage(id, updates);
    if (updatedRoom) {
      const rooms = getRoomsFromStorage();
      set({ rooms });

      const changes = buildRoomUpdateChanges(oldRoom, updates);

      addRoomChangeLog({
        roomId: id,
        type: 'update',
        timestamp: new Date().toISOString(),
        changes,
        description: '编辑会议室',
      });
    }
    return updatedRoom;
  },

  toggleRoomStatus: (id) => {
    const { rooms } = get();
    const oldRoom = rooms.find((r) => r.id === id);
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

      const isActivating = updatedRoom.status === 'active';
      addRoomChangeLog({
        roomId: id,
        type: isActivating ? 'activate' : 'deactivate',
        timestamp: new Date().toISOString(),
        changes: buildRoomStatusChanges(oldRoom?.status, isActivating),
        description: isActivating ? '启用会议室' : '停用会议室',
      });
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

  getBookingChangeLogs: (bookingId) => {
    return getBookingChangeLogsByBookingId(bookingId);
  },

  getRoomChangeLogs: (roomId) => {
    return getRoomChangeLogsByRoomId(roomId);
  },
};
});
