import {
  Booking,
  BookingFormData,
  MeetingRoom,
  FieldChange,
  BookingChangeType,
  RoomChangeType,
} from '../types';

export function buildBookingCreateChanges(
  data: BookingFormData,
  roomName: string,
  recurrenceId?: string
): FieldChange[] {
  const changes: FieldChange[] = [
    { field: 'title', label: '会议主题', oldValue: undefined, newValue: data.title },
    { field: 'roomId', label: '会议室', oldValue: undefined, newValue: roomName },
    { field: 'startTime', label: '开始时间', oldValue: undefined, newValue: data.startTime },
    { field: 'endTime', label: '结束时间', oldValue: undefined, newValue: data.endTime },
    { field: 'department', label: '使用科室', oldValue: undefined, newValue: data.department },
    { field: 'attendees', label: '参会人数', oldValue: undefined, newValue: data.attendees },
    { field: 'contact', label: '联系人', oldValue: undefined, newValue: data.contact },
    { field: 'phone', label: '联系电话', oldValue: undefined, newValue: data.phone },
    { field: 'remarks', label: '备注', oldValue: undefined, newValue: data.remarks || '' },
  ];

  if (recurrenceId) {
    changes.push({ field: 'recurrence', label: '重复系列', oldValue: undefined, newValue: recurrenceId });
  }

  return changes;
}

export function buildBookingUpdateChanges(
  oldBooking: Booking | undefined,
  data: BookingFormData,
  oldRoomName: string | undefined,
  newRoomName: string
): FieldChange[] {
  const changes: FieldChange[] = [];

  if (!oldBooking) return changes;

  if (oldBooking.title !== data.title) {
    changes.push({ field: 'title', label: '会议主题', oldValue: oldBooking.title, newValue: data.title });
  }
  if (oldBooking.roomId !== data.roomId) {
    changes.push({ field: 'roomId', label: '会议室', oldValue: oldRoomName, newValue: newRoomName });
  }
  if (oldBooking.startTime !== data.startTime) {
    changes.push({ field: 'startTime', label: '开始时间', oldValue: oldBooking.startTime, newValue: data.startTime });
  }
  if (oldBooking.endTime !== data.endTime) {
    changes.push({ field: 'endTime', label: '结束时间', oldValue: oldBooking.endTime, newValue: data.endTime });
  }
  if (oldBooking.department !== data.department) {
    changes.push({ field: 'department', label: '使用科室', oldValue: oldBooking.department, newValue: data.department });
  }
  if (oldBooking.attendees !== data.attendees) {
    changes.push({ field: 'attendees', label: '参会人数', oldValue: oldBooking.attendees, newValue: data.attendees });
  }
  if (oldBooking.contact !== data.contact) {
    changes.push({ field: 'contact', label: '联系人', oldValue: oldBooking.contact, newValue: data.contact });
  }
  if (oldBooking.phone !== data.phone) {
    changes.push({ field: 'phone', label: '联系电话', oldValue: oldBooking.phone, newValue: data.phone });
  }
  if ((oldBooking.remarks || '') !== (data.remarks || '')) {
    changes.push({ field: 'remarks', label: '备注', oldValue: oldBooking.remarks || '', newValue: data.remarks || '' });
  }

  return changes;
}

export function buildRecurrenceBookingUpdateChanges(
  oldBooking: Booking | undefined,
  data: BookingFormData,
  newStartTime: string,
  newEndTime: string,
  oldRoomName: string | undefined,
  newRoomName: string
): FieldChange[] {
  const changes: FieldChange[] = [];

  if (!oldBooking) return changes;

  if (oldBooking.title !== data.title) {
    changes.push({ field: 'title', label: '会议主题', oldValue: oldBooking.title, newValue: data.title });
  }
  if (oldBooking.roomId !== data.roomId) {
    changes.push({ field: 'roomId', label: '会议室', oldValue: oldRoomName, newValue: newRoomName });
  }
  if (oldBooking.startTime !== newStartTime) {
    changes.push({ field: 'startTime', label: '开始时间', oldValue: oldBooking.startTime, newValue: newStartTime });
  }
  if (oldBooking.endTime !== newEndTime) {
    changes.push({ field: 'endTime', label: '结束时间', oldValue: oldBooking.endTime, newValue: newEndTime });
  }
  if (oldBooking.department !== data.department) {
    changes.push({ field: 'department', label: '使用科室', oldValue: oldBooking.department, newValue: data.department });
  }
  if (oldBooking.attendees !== data.attendees) {
    changes.push({ field: 'attendees', label: '参会人数', oldValue: oldBooking.attendees, newValue: data.attendees });
  }
  if (oldBooking.contact !== data.contact) {
    changes.push({ field: 'contact', label: '联系人', oldValue: oldBooking.contact, newValue: data.contact });
  }
  if (oldBooking.phone !== data.phone) {
    changes.push({ field: 'phone', label: '联系电话', oldValue: oldBooking.phone, newValue: data.phone });
  }
  if ((oldBooking.remarks || '') !== (data.remarks || '')) {
    changes.push({ field: 'remarks', label: '备注', oldValue: oldBooking.remarks || '', newValue: data.remarks || '' });
  }

  return changes;
}

export function buildBookingCancelChanges(): FieldChange[] {
  return [
    { field: 'status', label: '状态', oldValue: '已预订', newValue: '已取消' },
  ];
}

export function getBookingChangeDescription(type: BookingChangeType, isRecurrence: boolean): string {
  if (isRecurrence) {
    switch (type) {
      case 'create':
        return '新建重复预订';
      case 'update':
        return '修改重复预订系列';
      case 'cancel':
        return '取消重复预订系列';
    }
  }
  switch (type) {
    case 'create':
      return '新建预订';
    case 'update':
      return '修改预订';
    case 'cancel':
      return '取消预订';
  }
}

export function buildRoomCreateChanges(room: Omit<MeetingRoom, 'id' | 'status'>): FieldChange[] {
  return [
    { field: 'name', label: '会议室名称', oldValue: undefined, newValue: room.name },
    { field: 'capacity', label: '容量', oldValue: undefined, newValue: room.capacity },
    { field: 'location', label: '位置', oldValue: undefined, newValue: room.location },
    { field: 'color', label: '标识颜色', oldValue: undefined, newValue: room.color },
    { field: 'facilities', label: '设备标签', oldValue: undefined, newValue: room.facilities },
  ];
}

export function buildRoomUpdateChanges(
  oldRoom: MeetingRoom | undefined,
  updates: Partial<Omit<MeetingRoom, 'id'>>
): FieldChange[] {
  const changes: FieldChange[] = [];

  if (!oldRoom) return changes;

  if (updates.name !== undefined && oldRoom.name !== updates.name) {
    changes.push({ field: 'name', label: '会议室名称', oldValue: oldRoom.name, newValue: updates.name });
  }
  if (updates.capacity !== undefined && oldRoom.capacity !== updates.capacity) {
    changes.push({ field: 'capacity', label: '容量', oldValue: oldRoom.capacity, newValue: updates.capacity });
  }
  if (updates.location !== undefined && oldRoom.location !== updates.location) {
    changes.push({ field: 'location', label: '位置', oldValue: oldRoom.location, newValue: updates.location });
  }
  if (updates.color !== undefined && oldRoom.color !== updates.color) {
    changes.push({ field: 'color', label: '标识颜色', oldValue: oldRoom.color, newValue: updates.color });
  }
  if (updates.facilities !== undefined && JSON.stringify(oldRoom.facilities) !== JSON.stringify(updates.facilities)) {
    changes.push({ field: 'facilities', label: '设备标签', oldValue: oldRoom.facilities, newValue: updates.facilities });
  }

  return changes;
}

export function buildRoomStatusChanges(
  oldStatus: string | undefined,
  isActivating: boolean
): FieldChange[] {
  const oldLabel = oldStatus === 'active' ? '启用' : '停用';
  const newLabel = isActivating ? '启用' : '停用';
  return [
    { field: 'status', label: '状态', oldValue: oldLabel, newValue: newLabel },
  ];
}

export function getRoomChangeDescription(type: RoomChangeType): string {
  switch (type) {
    case 'create':
      return '新增会议室';
    case 'update':
      return '编辑会议室';
    case 'activate':
      return '启用会议室';
    case 'deactivate':
      return '停用会议室';
  }
}
