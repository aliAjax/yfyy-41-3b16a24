import { Booking, ViewMode, MeetingRoom } from '../types';
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
  remarks: string;
}

function getRoomName(roomId: string, rooms: MeetingRoom[]): string {
  const room = rooms.find((r) => r.id === roomId);
  return room ? room.name : roomId;
}

function bookingsToExportRows(bookings: Booking[], rooms: MeetingRoom[]): ExportBookingRow[] {
  return bookings
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .map((booking) => ({
      roomName: getRoomName(booking.roomId, rooms),
      title: booking.title,
      department: booking.department,
      attendees: booking.attendees,
      startTime: formatDateTimeForExport(booking.startTime),
      endTime: formatDateTimeForExport(booking.endTime),
      contact: booking.contact,
      phone: booking.phone,
      remarks: booking.remarks || '',
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
    '备注',
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
      row.remarks,
    ]
      .map(escapeCsvValue)
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

function generateFileName(viewMode: ViewMode, date: Date, roomName: string, department: string): string {
  const safeRoomName = roomName.replace(/[\\/:*?"<>|]/g, '_');
  const safeDeptName = department === 'all' ? '全部科室' : department.replace(/[\\/:*?"<>|]/g, '_');

  if (viewMode === 'day') {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    return `会议室预定_${safeRoomName}_${safeDeptName}_日视图_${dateStr}.csv`;
  } else {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const startStr = formatDate(weekStart, 'yyyyMMdd');
    const endStr = formatDate(weekEnd, 'yyyyMMdd');
    return `会议室预定_${safeRoomName}_${safeDeptName}_周视图_${startStr}-${endStr}.csv`;
  }
}

function getBookingsForExport(
  bookings: Booking[],
  viewMode: ViewMode,
  date: Date,
  roomId: string,
  department: string
): Booking[] {
  let filteredBookings: Booking[];
  if (viewMode === 'day') {
    filteredBookings = getBookingsForDate(bookings, date, roomId);
  } else {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    filteredBookings = getBookingsForWeek(bookings, weekStart, roomId);
  }

  if (department !== 'all') {
    filteredBookings = filteredBookings.filter((b) => b.department === department);
  }

  return filteredBookings;
}

export function exportBookingsToCsv(
  bookings: Booking[],
  viewMode: ViewMode,
  date: Date,
  roomId: string,
  rooms: MeetingRoom[],
  department: string
): { success: boolean; message: string } {
  const filteredBookings = getBookingsForExport(bookings, viewMode, date, roomId, department);

  if (filteredBookings.length === 0) {
    return { success: false, message: '当前筛选条件下没有可导出的预定数据' };
  }

  const rows = bookingsToExportRows(filteredBookings, rooms);
  const csvContent = rowsToCsv(rows);

  const roomName = getRoomName(roomId, rooms);
  const fileName = generateFileName(viewMode, date, roomName, department);

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

  return { success: true, message: `成功导出 ${filteredBookings.length} 条预定` };
}
