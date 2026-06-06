import { Booking, BookingFormData, MeetingRoom } from '../types';
import { hasConflict, generateId } from './dateUtils';

export type ValidationErrorType =
  | 'missing_field'
  | 'invalid_format'
  | 'room_not_found'
  | 'capacity_exceeded'
  | 'time_conflict';

export interface ValidationError {
  type: ValidationErrorType;
  field?: string;
  message: string;
}

export interface ParsedBookingRow {
  rowIndex: number;
  rawData: Record<string, string>;
  formData?: BookingFormData;
  errors: ValidationError[];
  isValid: boolean;
}

export interface ImportResult {
  success: boolean;
  totalCount: number;
  successCount: number;
  failedCount: number;
  bookings?: Booking[];
  message: string;
}

const REQUIRED_FIELDS = [
  '会议室名称',
  '会议主题',
  '使用科室',
  '参会人数',
  '日期',
  '开始时间',
  '结束时间',
  '联系人',
];

const FIELD_ALIASES: Record<string, string[]> = {
  '会议室名称': ['会议室名称', '会议室', 'room', 'roomName', 'room_name'],
  '会议主题': ['会议主题', '主题', 'title', 'meeting_title'],
  '使用科室': ['使用科室', '科室', 'department', 'dept'],
  '参会人数': ['参会人数', '人数', 'attendees', 'people_count'],
  '日期': ['日期', 'date', 'meeting_date'],
  '开始时间': ['开始时间', '开始', 'startTime', 'start_time', 'start'],
  '结束时间': ['结束时间', '结束', 'endTime', 'end_time', 'end'],
  '联系人': ['联系人', 'contact', 'contact_person'],
  '联系电话': ['联系电话', '电话', 'phone', 'telephone', 'tel'],
  '备注': ['备注', 'remarks', 'remark', 'notes', 'note'],
};

function normalizeHeader(header: string): string {
  const trimmed = header.trim();
  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      return canonical;
    }
  }
  return trimmed;
}

export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(',').map((h) => h.trim());
  const headers = rawHeaders.map(normalizeHeader);

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim();
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function isValidTime(timeStr: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr);
}

function validateSingleRow(
  row: Record<string, string>,
  rowIndex: number,
  rooms: MeetingRoom[]
): ParsedBookingRow {
  const errors: ValidationError[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || !row[field].trim()) {
      errors.push({
        type: 'missing_field',
        field,
        message: `缺少必填字段：${field}`,
      });
    }
  }

  if (errors.some((e) => e.type === 'missing_field')) {
    return {
      rowIndex,
      rawData: row,
      errors,
      isValid: false,
    };
  }

  const roomName = row['会议室名称'];
  const room = rooms.find(
    (r) => r.name === roomName || r.id === roomName
  );
  if (!room) {
    errors.push({
      type: 'room_not_found',
      field: '会议室名称',
      message: `会议室不存在：${roomName}`,
    });
  } else if (room.status === 'inactive') {
    errors.push({
      type: 'room_not_found',
      field: '会议室名称',
      message: `会议室已停用：${roomName}`,
    });
  }

  const dateStr = row['日期'];
  const startTimeStr = row['开始时间'];
  const endTimeStr = row['结束时间'];

  if (!isValidDate(dateStr)) {
    errors.push({
      type: 'invalid_format',
      field: '日期',
      message: `日期格式无效：${dateStr}（请使用YYYY-MM-DD格式）`,
    });
  }

  if (!isValidTime(startTimeStr)) {
    errors.push({
      type: 'invalid_format',
      field: '开始时间',
      message: `开始时间格式无效：${startTimeStr}（请使用HH:mm格式）`,
    });
  }

  if (!isValidTime(endTimeStr)) {
    errors.push({
      type: 'invalid_format',
      field: '结束时间',
      message: `结束时间格式无效：${endTimeStr}（请使用HH:mm格式）`,
    });
  }

  const attendees = parseInt(row['参会人数'], 10);
  if (isNaN(attendees) || attendees <= 0) {
    errors.push({
      type: 'invalid_format',
      field: '参会人数',
      message: `参会人数必须为正整数：${row['参会人数']}`,
    });
  }

  if (
    room &&
    !isNaN(attendees) &&
    attendees > 0 &&
    attendees > room.capacity
  ) {
    errors.push({
      type: 'capacity_exceeded',
      field: '参会人数',
      message: `参会人数（${attendees}人）超出会议室容量（最多${room.capacity}人）`,
    });
  }

  if (
    isValidDate(dateStr) &&
    isValidTime(startTimeStr) &&
    isValidTime(endTimeStr)
  ) {
    const startDateTime = new Date(`${dateStr}T${startTimeStr}:00`);
    const endDateTime = new Date(`${dateStr}T${endTimeStr}:00`);

    if (startDateTime >= endDateTime) {
      errors.push({
        type: 'invalid_format',
        field: '结束时间',
        message: '结束时间必须晚于开始时间',
      });
    }
  }

  const isValid = errors.length === 0;

  let formData: BookingFormData | undefined;
  if (isValid && room) {
    formData = {
      roomId: room.id,
      title: row['会议主题'],
      department: row['使用科室'],
      attendees: attendees,
      startTime: `${dateStr}T${startTimeStr}:00`,
      endTime: `${dateStr}T${endTimeStr}:00`,
      contact: row['联系人'],
      phone: row['联系电话'] || '',
      remarks: row['备注'] || '',
    };
  }

  return {
    rowIndex,
    rawData: row,
    formData,
    errors,
    isValid,
  };
}

export function validateParsedRows(
  rows: Record<string, string>[],
  rooms: MeetingRoom[],
  existingBookings: Booking[] = []
): ParsedBookingRow[] {
  const parsedRows = rows.map((row, idx) => validateSingleRow(row, idx + 1, rooms));

  const validRows = parsedRows.filter((r) => r.isValid);

  for (let i = 0; i < validRows.length; i++) {
    for (let j = i + 1; j < validRows.length; j++) {
      const rowA = validRows[i];
      const rowB = validRows[j];

      if (!rowA.formData || !rowB.formData) continue;
      if (rowA.formData.roomId !== rowB.formData.roomId) continue;

      const startA = new Date(rowA.formData.startTime);
      const endA = new Date(rowA.formData.endTime);
      const startB = new Date(rowB.formData.startTime);
      const endB = new Date(rowB.formData.endTime);

      if (startA < endB && endA > startB) {
        rowA.errors.push({
          type: 'time_conflict',
          field: '时间',
          message: `与第${rowB.rowIndex}行时间冲突（同一会议室）`,
        });
        rowB.errors.push({
          type: 'time_conflict',
          field: '时间',
          message: `与第${rowA.rowIndex}行时间冲突（同一会议室）`,
        });
        rowA.isValid = false;
        rowB.isValid = false;
      }
    }
  }

  for (const row of validRows) {
    if (!row.isValid || !row.formData) continue;

    const startDate = new Date(row.formData.startTime);
    const endDate = new Date(row.formData.endTime);

    if (
      hasConflict(existingBookings, row.formData.roomId, startDate, endDate)
    ) {
      row.errors.push({
        type: 'time_conflict',
        field: '时间',
        message: '与已有预定时间冲突',
      });
      row.isValid = false;
    }
  }

  return parsedRows;
}

export function createBookingsFromValidRows(
  validRows: ParsedBookingRow[]
): Booking[] {
  const now = new Date().toISOString();
  return validRows
    .filter((r) => r.isValid && r.formData)
    .map((r) => ({
      id: generateId(),
      ...r.formData!,
      createdAt: now,
    }));
}

export function generateSampleCSV(): string {
  return `会议室名称,会议主题,使用科室,参会人数,日期,开始时间,结束时间,联系人,联系电话,备注
大会议室,季度总结会,综合办公室,30,2026-06-10,09:00,11:00,张三,13800138000,季度工作总结
中会议室,产品评审会,研发部,15,2026-06-10,14:00,16:00,李四,13800138001,新产品方案评审
小会议室,技术分享,技术部,6,2026-06-11,10:00,11:30,王五,13800138002,前端技术分享
洽谈室,客户洽谈,销售部,4,2026-06-11,15:00,16:00,赵六,13800138003,重要客户来访`;
}
