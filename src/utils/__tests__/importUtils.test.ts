import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  validateSingleRow,
  validateParsedRows,
  createBookingsFromValidRows,
  generateSampleCSV,
} from '../importUtils';
import { MeetingRoom, Booking } from '../../types';

const mockRooms: MeetingRoom[] = [
  {
    id: 'room-1',
    name: '大会议室',
    capacity: 50,
    location: '3楼',
    color: '#3b82f6',
    status: 'active',
    facilities: ['projector', 'whiteboard'],
  },
  {
    id: 'room-2',
    name: '中会议室',
    capacity: 20,
    location: '2楼',
    color: '#10b981',
    status: 'active',
    facilities: ['whiteboard'],
  },
  {
    id: 'room-3',
    name: '小会议室',
    capacity: 8,
    location: '2楼',
    color: '#f59e0b',
    status: 'inactive',
    facilities: ['whiteboard'],
  },
];

const validRow = {
  '会议室名称': '大会议室',
  '会议主题': '季度总结会',
  '使用科室': '综合办公室',
  '参会人数': '30',
  '日期': '2026-06-10',
  '开始时间': '09:00',
  '结束时间': '11:00',
  '联系人': '张三',
  '联系电话': '13800138000',
  '备注': '季度工作总结',
};

describe('parseCSV', () => {
  it('should parse basic CSV correctly', () => {
    const csv = `会议室名称,会议主题
大会议室,季度总结会
中会议室,产品评审会`;
    const rows = parseCSV(csv);
    expect(rows.length).toBe(2);
    expect(rows[0]['会议室名称']).toBe('大会议室');
    expect(rows[0]['会议主题']).toBe('季度总结会');
    expect(rows[1]['会议室名称']).toBe('中会议室');
  });

  it('should handle field aliases (English to Chinese)', () => {
    const csv = `room,title,department,attendees,date,startTime,endTime,contact,phone,remarks
大会议室,季度总结会,综合办公室,30,2026-06-10,09:00,11:00,张三,13800138000,备注内容`;
    const rows = parseCSV(csv);
    expect(rows.length).toBe(1);
    expect(rows[0]['会议室名称']).toBe('大会议室');
    expect(rows[0]['会议主题']).toBe('季度总结会');
    expect(rows[0]['使用科室']).toBe('综合办公室');
    expect(rows[0]['参会人数']).toBe('30');
    expect(rows[0]['日期']).toBe('2026-06-10');
    expect(rows[0]['开始时间']).toBe('09:00');
    expect(rows[0]['结束时间']).toBe('11:00');
    expect(rows[0]['联系人']).toBe('张三');
    expect(rows[0]['联系电话']).toBe('13800138000');
    expect(rows[0]['备注']).toBe('备注内容');
  });

  it('should handle mixed case aliases', () => {
    const csv = `RoomName,Title
大会议室,测试会议`;
    const rows = parseCSV(csv);
    expect(rows.length).toBe(1);
    expect(rows[0]['会议室名称']).toBe('大会议室');
    expect(rows[0]['会议主题']).toBe('测试会议');
  });

  it('should handle quoted fields with commas', () => {
    const csv = `会议室名称,会议主题
大会议室,"季度总结,重要会议"`;
    const rows = parseCSV(csv);
    expect(rows.length).toBe(1);
    expect(rows[0]['会议主题']).toBe('季度总结,重要会议');
  });

  it('should handle double quotes inside quoted fields', () => {
    const csv = `会议室名称,会议主题
大会议室,"""重要""会议"`;
    const rows = parseCSV(csv);
    expect(rows[0]['会议主题']).toBe('"重要"会议');
  });

  it('should skip empty lines', () => {
    const csv = `会议室名称,会议主题
大会议室,会议A

中会议室,会议B
`;
    const rows = parseCSV(csv);
    expect(rows.length).toBe(2);
  });

  it('should return empty array for CSV with only header', () => {
    const csv = `会议室名称,会议主题`;
    const rows = parseCSV(csv);
    expect(rows.length).toBe(0);
  });

  it('should return empty array for empty CSV', () => {
    const rows = parseCSV('');
    expect(rows.length).toBe(0);
  });

  it('should parse sample CSV correctly', () => {
    const csv = generateSampleCSV();
    const rows = parseCSV(csv);
    expect(rows.length).toBe(4);
    expect(rows[0]['会议室名称']).toBe('大会议室');
    expect(rows[0]['会议主题']).toBe('季度总结会');
    expect(rows[3]['会议室名称']).toBe('洽谈室');
  });
});

describe('validateSingleRow - required fields', () => {
  it('should pass for a valid row', () => {
    const result = validateSingleRow(validRow, 1, mockRooms);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.formData).toBeDefined();
    expect(result.formData?.roomId).toBe('room-1');
    expect(result.formData?.title).toBe('季度总结会');
    expect(result.formData?.attendees).toBe(30);
  });

  it('should report missing required fields', () => {
    const row = { ...validRow, '会议主题': '' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.type === 'missing_field' && e.field === '会议主题')).toBe(true);
  });

  it('should report multiple missing fields', () => {
    const row = {
      '会议室名称': '',
      '会议主题': '',
      '使用科室': '综合办公室',
      '参会人数': '30',
      '日期': '2026-06-10',
      '开始时间': '09:00',
      '结束时间': '11:00',
      '联系人': '',
    };
    const result = validateSingleRow(row, 1, mockRooms);
    const missingFields = result.errors.filter(e => e.type === 'missing_field').map(e => e.field);
    expect(missingFields).toContain('会议室名称');
    expect(missingFields).toContain('会议主题');
    expect(missingFields).toContain('联系人');
    expect(result.isValid).toBe(false);
  });
});

describe('validateSingleRow - room validation', () => {
  it('should report room_not_found for non-existent room', () => {
    const row = { ...validRow, '会议室名称': '不存在的会议室' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.type === 'room_not_found')).toBe(true);
  });

  it('should report room_not_found for inactive room', () => {
    const row = { ...validRow, '会议室名称': '小会议室' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.type === 'room_not_found')).toBe(true);
    expect(result.errors.find(e => e.type === 'room_not_found')?.message).toContain('已停用');
  });

  it('should find room by id', () => {
    const row = { ...validRow, '会议室名称': 'room-1', '参会人数': '10' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.isValid).toBe(true);
    expect(result.formData?.roomId).toBe('room-1');
  });
});

describe('validateSingleRow - format validation', () => {
  it('should report invalid date format', () => {
    const row = { ...validRow, '日期': '2026/06/10' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.errors.some(e => e.type === 'invalid_format' && e.field === '日期')).toBe(true);
  });

  it('should report invalid start time format', () => {
    const row = { ...validRow, '开始时间': '10:' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.errors.some(e => e.type === 'invalid_format' && e.field === '开始时间')).toBe(true);
  });

  it('should report invalid end time format', () => {
    const row = { ...validRow, '结束时间': '25:00' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.errors.some(e => e.type === 'invalid_format' && e.field === '结束时间')).toBe(true);
  });

  it('should report invalid attendees (non-numeric)', () => {
    const row = { ...validRow, '参会人数': 'abc' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.errors.some(e => e.type === 'invalid_format' && e.field === '参会人数')).toBe(true);
  });

  it('should report invalid attendees (zero or negative)', () => {
    const row = { ...validRow, '参会人数': '0' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.errors.some(e => e.type === 'invalid_format' && e.field === '参会人数')).toBe(true);

    const row2 = { ...validRow, '参会人数': '-5' };
    const result2 = validateSingleRow(row2, 2, mockRooms);
    expect(result2.errors.some(e => e.type === 'invalid_format' && e.field === '参会人数')).toBe(true);
  });

  it('should report end time must be after start time', () => {
    const row = { ...validRow, '开始时间': '14:00', '结束时间': '10:00' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.errors.some(e => e.type === 'invalid_format' && e.field === '结束时间')).toBe(true);
  });

  it('should report same start and end time as invalid', () => {
    const row = { ...validRow, '开始时间': '10:00', '结束时间': '10:00' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.errors.some(e => e.type === 'invalid_format')).toBe(true);
  });
});

describe('validateSingleRow - capacity exceeded', () => {
  it('should report capacity exceeded when attendees exceed room capacity', () => {
    const row = { ...validRow, '会议室名称': '中会议室', '参会人数': '25' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.type === 'capacity_exceeded')).toBe(true);
    expect(result.errors.find(e => e.type === 'capacity_exceeded')?.message).toContain('25');
    expect(result.errors.find(e => e.type === 'capacity_exceeded')?.message).toContain('20');
  });

  it('should pass when attendees equal capacity', () => {
    const row = { ...validRow, '会议室名称': '中会议室', '参会人数': '20' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.isValid).toBe(true);
  });

  it('should pass when attendees below capacity', () => {
    const row = { ...validRow, '参会人数': '10' };
    const result = validateSingleRow(row, 1, mockRooms);
    expect(result.isValid).toBe(true);
  });
});

describe('validateParsedRows - in-file time conflicts', () => {
  it('should detect time conflict between two rows in same room', () => {
    const rows = [
      { ...validRow, '开始时间': '09:00', '结束时间': '11:00' },
      { ...validRow, '会议主题': '另一个会议', '开始时间': '10:00', '结束时间': '12:00' },
    ];
    const result = validateParsedRows(rows, mockRooms);
    expect(result[0].isValid).toBe(false);
    expect(result[1].isValid).toBe(false);
    expect(result[0].errors.some(e => e.type === 'time_conflict')).toBe(true);
    expect(result[1].errors.some(e => e.type === 'time_conflict')).toBe(true);
    expect(result[0].errors.find(e => e.type === 'time_conflict')?.message).toContain('第2行');
    expect(result[1].errors.find(e => e.type === 'time_conflict')?.message).toContain('第1行');
  });

  it('should NOT detect conflict for same-time bookings in different rooms', () => {
    const rows = [
      { ...validRow, '会议室名称': '大会议室', '开始时间': '09:00', '结束时间': '11:00' },
      { ...validRow, '会议室名称': '中会议室', '参会人数': '10', '会议主题': '另一个会议', '开始时间': '09:00', '结束时间': '11:00' },
    ];
    const result = validateParsedRows(rows, mockRooms);
    expect(result[0].isValid).toBe(true);
    expect(result[1].isValid).toBe(true);
  });

  it('should NOT detect conflict for back-to-back bookings', () => {
    const rows = [
      { ...validRow, '开始时间': '09:00', '结束时间': '11:00' },
      { ...validRow, '会议主题': '另一个会议', '开始时间': '11:00', '结束时间': '12:00' },
    ];
    const result = validateParsedRows(rows, mockRooms);
    expect(result[0].isValid).toBe(true);
    expect(result[1].isValid).toBe(true);
  });

  it('should detect conflict when one booking is entirely inside another', () => {
    const rows = [
      { ...validRow, '开始时间': '09:00', '结束时间': '17:00' },
      { ...validRow, '会议主题': '另一个会议', '开始时间': '10:00', '结束时间': '11:00' },
    ];
    const result = validateParsedRows(rows, mockRooms);
    expect(result[0].isValid).toBe(false);
    expect(result[1].isValid).toBe(false);
  });

  it('should handle three rows with multiple conflicts', () => {
    const rows = [
      { ...validRow, '开始时间': '09:00', '结束时间': '10:00' },
      { ...validRow, '会议主题': '会议B', '开始时间': '09:30', '结束时间': '10:30' },
      { ...validRow, '会议主题': '会议C', '开始时间': '10:00', '结束时间': '11:00' },
    ];
    const result = validateParsedRows(rows, mockRooms);
    expect(result[0].isValid).toBe(false);
    expect(result[1].isValid).toBe(false);
    expect(result[2].isValid).toBe(false);
    expect(result[0].errors.filter(e => e.type === 'time_conflict').length).toBeGreaterThanOrEqual(1);
  });
});

describe('validateParsedRows - conflicts with existing bookings', () => {
  const existingBookings: Booking[] = [
    {
      id: 'existing-1',
      roomId: 'room-1',
      title: '已有会议',
      department: '技术部',
      attendees: 10,
      startTime: '2026-06-10T10:00:00',
      endTime: '2026-06-10T12:00:00',
      contact: '李四',
      phone: '13800000000',
      remarks: '',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('should detect conflict with existing booking', () => {
    const rows = [{ ...validRow, '开始时间': '09:00', '结束时间': '11:00' }];
    const result = validateParsedRows(rows, mockRooms, existingBookings);
    expect(result[0].isValid).toBe(false);
    expect(result[0].errors.some(e => e.type === 'time_conflict')).toBe(true);
    expect(result[0].errors.find(e => e.type === 'time_conflict')?.message).toContain('已有预定');
  });

  it('should NOT report conflict for booking in different room', () => {
    const rows = [{ ...validRow, '会议室名称': '中会议室', '参会人数': '10', '开始时间': '10:00', '结束时间': '12:00' }];
    const result = validateParsedRows(rows, mockRooms, existingBookings);
    expect(result[0].isValid).toBe(true);
  });

  it('should NOT report conflict for non-overlapping time', () => {
    const rows = [{ ...validRow, '开始时间': '13:00', '结束时间': '14:00' }];
    const result = validateParsedRows(rows, mockRooms, existingBookings);
    expect(result[0].isValid).toBe(true);
  });

  it('should detect in-file conflicts and existing conflicts across different rows', () => {
    const rows = [
      { ...validRow, '开始时间': '09:00', '结束时间': '09:30' },
      { ...validRow, '会议主题': '文件内冲突', '开始时间': '09:15', '结束时间': '09:45' },
      { ...validRow, '会议主题': '和已有冲突', '开始时间': '11:00', '结束时间': '12:30' },
      { ...validRow, '会议室名称': '中会议室', '参会人数': '10', '会议主题': '无冲突', '开始时间': '13:00', '结束时间': '14:00' },
    ];
    const result = validateParsedRows(rows, mockRooms, existingBookings);

    expect(result[0].isValid).toBe(false);
    expect(result[0].errors.some(e => e.type === 'time_conflict')).toBe(true);

    expect(result[1].isValid).toBe(false);
    expect(result[1].errors.some(e => e.type === 'time_conflict')).toBe(true);

    expect(result[2].isValid).toBe(false);
    expect(result[2].errors.some(e => e.type === 'time_conflict')).toBe(true);
    expect(result[2].errors.find(e => e.type === 'time_conflict')?.message).toContain('已有预定');

    expect(result[3].isValid).toBe(true);

    const inFileConflictCount = result.filter(r =>
      r.errors.some(e => e.type === 'time_conflict' && e.message.includes('第'))
    ).length;
    expect(inFileConflictCount).toBeGreaterThanOrEqual(2);
  });
});

describe('createBookingsFromValidRows', () => {
  it('should create bookings from valid rows', () => {
    const rows = [
      { ...validRow, '开始时间': '09:00', '结束时间': '10:00' },
      { ...validRow, '会议室名称': '中会议室', '参会人数': '10', '会议主题': '第二个会议', '开始时间': '14:00', '结束时间': '15:00' },
    ];
    const parsedRows = validateParsedRows(rows, mockRooms);
    const validOnes = parsedRows.filter(r => r.isValid);
    expect(validOnes.length).toBe(2);

    const bookings = createBookingsFromValidRows(validOnes);
    expect(bookings.length).toBe(2);
    expect(bookings[0].title).toBe('季度总结会');
    expect(bookings[0].roomId).toBe('room-1');
    expect(bookings[1].title).toBe('第二个会议');
    expect(bookings[1].roomId).toBe('room-2');
    expect(bookings[0].id).toBeDefined();
    expect(bookings[0].createdAt).toBeDefined();
  });

  it('should skip invalid rows', () => {
    const rows = [
      { ...validRow, '参会人数': '100' },
    ];
    const parsedRows = validateParsedRows(rows, mockRooms);
    const bookings = createBookingsFromValidRows(parsedRows);
    expect(bookings.length).toBe(0);
  });
});
