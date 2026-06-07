import {
  Booking,
  BookingFormData,
  MeetingRoom,
  RecurrenceType,
  BookingConflictInfo,
  RecurrenceBookingResult,
} from '../types';
import { generateId, formatDateToLocalString, checkRecurrenceConflicts } from './dateUtils';

export interface RecurrenceValidationResult {
  valid: boolean;
  message: string;
}

export function validateRecurrenceCreateInput(
  data: BookingFormData,
  room: MeetingRoom | undefined,
  recurrenceEndDate: string
): RecurrenceValidationResult {
  const startDateTime = new Date(data.startTime);
  const endDateTime = new Date(data.endTime);
  const startDateStr = formatDateToLocalString(startDateTime);

  if (!room) {
    return { valid: false, message: '会议室不存在' };
  }
  if (room.status === 'inactive') {
    return { valid: false, message: '该会议室已停用，无法新建预定' };
  }
  if (data.attendees > room.capacity) {
    return { valid: false, message: `参会人数超出会议室容量（最多${room.capacity}人）` };
  }
  if (startDateTime >= endDateTime) {
    return { valid: false, message: '结束时间必须晚于开始时间' };
  }
  if (recurrenceEndDate < startDateStr) {
    return { valid: false, message: '重复结束日期不能早于开始日期' };
  }

  return { valid: true, message: '' };
}

export function validateRecurrenceUpdateInput(
  data: BookingFormData,
  room: MeetingRoom | undefined,
  existingSeries: Booking[],
  recurrenceEndDate: string
): RecurrenceValidationResult {
  if (existingSeries.length === 0) {
    return { valid: false, message: '未找到重复预订系列' };
  }

  const startDateTime = new Date(data.startTime);
  const endDateTime = new Date(data.endTime);
  const startDateStr = formatDateToLocalString(startDateTime);

  if (!room) {
    return { valid: false, message: '会议室不存在' };
  }
  if (room.status === 'inactive') {
    return { valid: false, message: '该会议室已停用' };
  }
  if (data.attendees > room.capacity) {
    return { valid: false, message: `参会人数超出会议室容量（最多${room.capacity}人）` };
  }
  if (startDateTime >= endDateTime) {
    return { valid: false, message: '结束时间必须晚于开始时间' };
  }
  if (recurrenceEndDate < startDateStr) {
    return { valid: false, message: '重复结束日期不能早于开始日期' };
  }

  return { valid: true, message: '' };
}

export function getTimeStrings(startDateTime: Date, endDateTime: Date): { startTimeStr: string; endTimeStr: string } {
  const startTimeStr = `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`;
  const endTimeStr = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;
  return { startTimeStr, endTimeStr };
}

export function getRecurrenceConflictInfos(
  bookings: Booking[],
  roomId: string,
  startDateStr: string,
  recurrenceEndDate: string,
  startTimeStr: string,
  endTimeStr: string,
  type: RecurrenceType,
  excludeRecurrenceId?: string
): BookingConflictInfo[] {
  const start = new Date(`${startDateStr}T00:00:00`);
  const end = new Date(`${recurrenceEndDate}T23:59:59`);
  return checkRecurrenceConflicts(bookings, roomId, start, end, startTimeStr, endTimeStr, type, excludeRecurrenceId);
}

export function buildRecurrenceConflictResult(
  conflictInfos: BookingConflictInfo[],
  skipConflicts: boolean
): { totalCount: number; conflictCount: number; canProceed: boolean; message: string } {
  const totalCount = conflictInfos.length;
  const conflictCount = conflictInfos.filter((c) => c.hasConflict).length;

  if (totalCount === 0) {
    return { totalCount: 0, conflictCount: 0, canProceed: false, message: '没有有效的预定日期' };
  }

  if (!skipConflicts && conflictCount > 0) {
    return {
      totalCount,
      conflictCount,
      canProceed: false,
      message: `共 ${totalCount} 场预定，其中 ${conflictCount} 场存在冲突`,
    };
  }

  return { totalCount, conflictCount, canProceed: true, message: '' };
}

export function buildRecurrenceBookings(
  data: BookingFormData,
  conflictInfos: BookingConflictInfo[],
  type: RecurrenceType,
  recurrenceEndDate: string,
  recurrenceId: string,
  now: string,
  skipConflicts: boolean
): Booking[] {
  const createdBookings: Booking[] = [];
  let index = 0;

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

  return createdBookings;
}

export function buildUpdatedRecurrenceBookings(
  data: BookingFormData,
  conflictInfos: BookingConflictInfo[],
  type: RecurrenceType,
  recurrenceEndDate: string,
  recurrenceId: string,
  now: string,
  existingSeries: Booking[],
  skipConflicts: boolean
): Booking[] {
  const updatedBookingsList: Booking[] = [];
  let index = 0;

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

  return updatedBookingsList;
}

export function buildRecurrenceSuccessResult(
  totalCount: number,
  successCount: number,
  conflictCount: number,
  bookings: Booking[],
  skipConflicts: boolean,
  action: 'create' | 'update'
): RecurrenceBookingResult {
  const actionText = action === 'create' ? '创建' : '更新';
  const message = `成功${actionText} ${successCount} 场重复预定${skipConflicts && conflictCount > 0 ? `（跳过 ${conflictCount} 场冲突）` : ''}`;

  return {
    success: true,
    totalCount,
    successCount,
    conflictCount,
    message,
    createdBookings: bookings,
  };
}

export function buildRecurrenceErrorResult(
  totalCount: number,
  conflictCount: number,
  message: string
): RecurrenceBookingResult {
  return {
    success: false,
    totalCount,
    successCount: 0,
    conflictCount,
    message,
  };
}
