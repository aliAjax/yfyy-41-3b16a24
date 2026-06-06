import { Booking, ViewMode, MeetingRoom } from '../types';
import { MEETING_ROOMS } from '../constants';
import { formatDate, getBookingsForDate, getBookingsForWeek } from './dateUtils';
import { startOfWeek, addDays } from 'date-fns';

interface ExportBookingRow {
  roomName: string;
  title: string;
  department: string;
  attendees: number;
  startTime: string;
  endTime: string;
  contact: string;
  phone: string;
}

function getRoomName(roomId: string): string {
  const room = MEETING_ROOMS.find((r) => r.id === roomId);
  return room ? room.name : roomId;
}

function bookingsToExportRows(bookings: Booking[]): ExportBookingRow[] {
  return bookings
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .map((booking) => ({
      roomName: getRoomName(booking.roomId),
      title: booking.title,
      department: booking.department,
      attendees: booking.attendees,
      startTime: formatDateTimeForExport(booking.startTime),
      endTime: formatDateTimeForExport(booking.endTime),
      contact: booking.contact,
      phone: booking.phone,
    }));
}

function formatDateTimeForExport(dateStr: string): string {
  return formatDate(new Date(dateStr), 'yyyy-MM-dd HH:mm');
}

function escapeCsvValue(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows: ExportBookingRow[]): string {
  const headers = [
    '会议室',
    '会议主题',
    '使用科室',
    '参会人数',
    '开始时间',
    '结束时间',
    '联系人',
    '联系电话',
  ];

  const headerRow = headers.map(escapeCsvValue).join(',');

  const dataRows = rows.map((row) =>
    [
      row.roomName,
      row.title,
      row.department,
      row.attendees,
      row.startTime,
      row.endTime,
      row.contact,
      row.phone,
    ]
      .map(escapeCsvValue)
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

function generateFileName(viewMode: ViewMode, date: Date, roomName: string): string {
  const safeRoomName = roomName.replace(/[\\/:*?"<>|]/g, '_');

  if (viewMode === 'day') {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    return `会议室预定_${safeRoomName}_日视图_${dateStr}.csv`;
  } else {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const startStr = formatDate(weekStart, 'yyyyMMdd');
    const endStr = formatDate(weekEnd, 'yyyyMMdd');
    return `会议室预定_${safeRoomName}_周视图_${startStr}-${endStr}.csv`;
  }
}

function getBookingsForExport(
  bookings: Booking[],
  viewMode: ViewMode,
  date: Date,
  roomId: string
): Booking[] {
  if (viewMode === 'day') {
    return getBookingsForDate(bookings, date, roomId);
  } else {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    return getBookingsForWeek(bookings, weekStart, roomId);
  }
}

export function exportBookingsToCsv(
  bookings: Booking[],
  viewMode: ViewMode,
  date: Date,
  roomId: string
): void {
  const filteredBookings = getBookingsForExport(bookings, viewMode, date, roomId);
  const rows = bookingsToExportRows(filteredBookings);
  const csvContent = rowsToCsv(rows);

  const roomName = getRoomName(roomId);
  const fileName = generateFileName(viewMode, date, roomName);

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
