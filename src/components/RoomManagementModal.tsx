import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle,
  Palette,
  Projector,
  Video,
  Square,
  Phone,
  History,
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { MeetingRoom, FacilityType } from '../types';
import { FACILITY_LIST } from '../constants';
import { format } from 'date-fns';

const COLOR_PRESETS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#f97316',
];

interface RoomFormData {
  name: string;
  capacity: number;
  location: string;
  color: string;
  facilities: FacilityType[];
}

const emptyFormData: RoomFormData = {
  name: '',
  capacity: 10,
  location: '',
  color: '#3b82f6',
  facilities: [],
};

export function RoomManagementModal() {
  const {
    isRoomManagementModalOpen,
    setIsRoomManagementModalOpen,
    rooms,
    addRoom,
    updateRoom,
    toggleRoomStatus,
    deleteRoom,
    hasBookingsForRoom,
    selectedRoomId,
    setSelectedRoomId,
    getRoomChangeLogs,
  } = useBookingStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);
  const [formData, setFormData] = useState<RoomFormData>(emptyFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (isRoomManagementModalOpen) {
      setIsEditing(false);
      setEditingRoom(null);
      setFormData(emptyFormData);
      setError('');
      setSuccess('');
    }
  }, [isRoomManagementModalOpen]);

  const handleClose = () => {
    setIsRoomManagementModalOpen(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
    setError('');
  };

  const handleColorSelect = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
    setShowColorPicker(false);
  };

  const handleFacilityToggle = (facilityType: FacilityType) => {
    setFormData((prev) => {
      const hasFacility = prev.facilities.includes(facilityType);
      return {
        ...prev,
        facilities: hasFacility
          ? prev.facilities.filter((f) => f !== facilityType)
          : [...prev.facilities, facilityType],
      };
    });
    setError('');
  };

  const getFacilityIcon = (iconName: string) => {
    switch (iconName) {
      case 'projector':
        return <Projector className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'square':
        return <Square className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleStartAdd = () => {
    setIsEditing(true);
    setEditingRoom(null);
    setFormData(emptyFormData);
    setError('');
    setSuccess('');
  };

  const handleStartEdit = (room: MeetingRoom) => {
    setIsEditing(true);
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      location: room.location,
      color: room.color,
      facilities: room.facilities || [],
    });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingRoom(null);
    setFormData(emptyFormData);
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('请输入会议室名称');
      return false;
    }
    if (formData.capacity <= 0) {
      setError('容量必须大于0');
      return false;
    }
    if (!formData.location.trim()) {
      setError('请输入位置');
      return false;
    }

    const duplicateName = rooms.some(
      (r) => r.name === formData.name.trim() && r.id !== editingRoom?.id
    );
    if (duplicateName) {
      setError('会议室名称已存在');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (editingRoom) {
      const result = updateRoom(editingRoom.id, {
        name: formData.name.trim(),
        capacity: formData.capacity,
        location: formData.location.trim(),
        color: formData.color,
        facilities: formData.facilities,
      });
      if (result) {
        setSuccess('会议室更新成功');
        setIsEditing(false);
        setEditingRoom(null);
        setTimeout(() => setSuccess(''), 2000);
      }
    } else {
      const newRoom = addRoom({
        name: formData.name.trim(),
        capacity: formData.capacity,
        location: formData.location.trim(),
        color: formData.color,
        facilities: formData.facilities,
      });
      if (newRoom) {
        setSuccess('会议室添加成功');
        setIsEditing(false);
        setFormData(emptyFormData);
        if (selectedRoomId === '' || !rooms.find((r) => r.id === selectedRoomId)) {
          setSelectedRoomId(newRoom.id);
        }
        setTimeout(() => setSuccess(''), 2000);
      }
    }
  };

  const handleToggleStatus = (room: MeetingRoom) => {
    const action = room.status === 'active' ? '停用' : '启用';
    if (room.status === 'active' && hasBookingsForRoom(room.id)) {
      if (!window.confirm(`确定要停用"${room.name}"吗？\n停用后将不能新建预定，但历史预定仍可查看。`)) {
        return;
      }
    } else if (!window.confirm(`确定要${action}"${room.name}"吗？`)) {
      return;
    }
    toggleRoomStatus(room.id);
  };

  const handleDelete = (room: MeetingRoom) => {
    if (!window.confirm(`确定要删除"${room.name}"吗？此操作不可恢复。`)) {
      return;
    }
    const result = deleteRoom(room.id);
    if (!result.success) {
      setError(result.message);
    }
  };

  const sortedRooms = [...rooms].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'active' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  if (!isRoomManagementModalOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
            会议室管理
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                {editingRoom ? '编辑会议室' : '新增会议室'}
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  会议室名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="请输入会议室名称"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    容量（人） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    位置 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="如：3楼"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <Palette className="w-4 h-4 inline mr-1" />
                  标识颜色
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: formData.color }}
                    ></div>
                    <span className="text-slate-600">选择颜色</span>
                  </button>
                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-slate-200 rounded-lg shadow-lg z-10 grid grid-cols-5 gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorSelect(color)}
                          className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                            formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  设备标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {FACILITY_LIST.map((facility) => {
                    const isSelected = formData.facilities.includes(facility.type);
                    return (
                      <button
                        key={facility.type}
                        type="button"
                        onClick={() => handleFacilityToggle(facility.type)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {getFacilityIcon(facility.icon)}
                        <span>{facility.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors shadow-md hover:shadow-lg"
                >
                  {editingRoom ? '保存修改' : '添加会议室'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">
                  共 {rooms.length} 个会议室（{rooms.filter((r) => r.status === 'active').length} 个启用）
                </p>
                <button
                  onClick={handleStartAdd}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  新增会议室
                </button>
              </div>

              <div className="space-y-3">
                {sortedRooms.map((room) => {
                  const hasBookings = hasBookingsForRoom(room.id);
                  const isInactive = room.status === 'inactive';

                  return (
                    <div
                      key={room.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isInactive
                          ? 'bg-slate-50 border-slate-200 opacity-70'
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: room.color }}
                          ></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-800">{room.name}</h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  isInactive
                                    ? 'bg-slate-200 text-slate-600'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {isInactive ? '已停用' : '启用中'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                <span>{room.capacity}人</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{room.location}</span>
                              </div>
                              {hasBookings && (
                                <span className="text-xs text-amber-600 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  有历史预定
                                </span>
                              )}
                            </div>
                            {room.facilities && room.facilities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {room.facilities.map((facilityType) => {
                                  const facility = FACILITY_LIST.find((f) => f.type === facilityType);
                                  if (!facility) return null;
                                  return (
                                    <span
                                      key={facilityType}
                                      className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1"
                                    >
                                      {getFacilityIcon(facility.icon)}
                                      {facility.label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setExpandedRoomId(expandedRoomId === room.id ? null : room.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              expandedRoomId === room.id
                                ? 'text-blue-500 bg-blue-50'
                                : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'
                            }`}
                            title="变更记录"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(room)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(room)}
                            className={`p-2 rounded-lg transition-colors ${
                              isInactive
                                ? 'text-slate-400 hover:text-green-500 hover:bg-green-50'
                                : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                            }`}
                            title={isInactive ? '启用' : '停用'}
                          >
                            {isInactive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(room)}
                            disabled={hasBookings}
                            className={`p-2 rounded-lg transition-colors ${
                              hasBookings
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title={hasBookings ? '有历史预定，无法删除' : '删除'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {expandedRoomId === room.id && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5" />
                            变更记录
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {getRoomChangeLogs(room.id).length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-3">暂无变更记录</p>
                            ) : (
                              getRoomChangeLogs(room.id).map((log) => (
                                <div
                                  key={log.id}
                                  className="p-2.5 bg-slate-50 rounded-lg text-xs"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span
                                      className={`font-medium px-2 py-0.5 rounded-full ${
                                        log.type === 'create'
                                          ? 'bg-green-100 text-green-700'
                                          : log.type === 'update'
                                          ? 'bg-blue-100 text-blue-700'
                                          : log.type === 'activate'
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      {log.type === 'create'
                                        ? '新增'
                                        : log.type === 'update'
                                        ? '编辑'
                                        : log.type === 'activate'
                                        ? '启用'
                                        : '停用'}
                                    </span>
                                    <span className="text-slate-400">
                                      {format(new Date(log.timestamp), 'MM-dd HH:mm')}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 mb-1">{log.description}</p>
                                  {log.changes.length > 0 && (
                                    <div className="space-y-0.5">
                                      {log.changes.map((change, idx) => (
                                        <div
                                          key={idx}
                                          className="text-slate-500 flex items-start gap-1"
                                        >
                                          <span className="text-slate-300">•</span>
                                          <span>
                                            <span className="text-slate-500">{change.label}：</span>
                                            {log.type === 'create' ? (
                                              <span className="text-green-600">
                                                {Array.isArray(change.newValue)
                                                  ? (change.newValue as string[]).length > 0
                                                    ? (change.newValue as string[])
                                                        .map((f) => {
                                                          const facility = FACILITY_LIST.find(
                                                            (fa) => fa.type === f
                                                          );
                                                          return facility?.label || f;
                                                        })
                                                        .join('、')
                                                    : '无'
                                                  : change.newValue}
                                              </span>
                                            ) : log.type === 'activate' || log.type === 'deactivate' ? (
                                              <span
                                                className={
                                                  log.type === 'activate'
                                                    ? 'text-green-600'
                                                    : 'text-amber-600'
                                                }
                                              >
                                                {String(change.newValue)}
                                              </span>
                                            ) : (
                                              <>
                                                <span className="text-slate-400 line-through">
                                                  {Array.isArray(change.oldValue)
                                                    ? (change.oldValue as string[]).length > 0
                                                      ? (change.oldValue as string[])
                                                          .map((f) => {
                                                            const facility = FACILITY_LIST.find(
                                                              (fa) => fa.type === f
                                                            );
                                                            return facility?.label || f;
                                                          })
                                                          .join('、')
                                                      : '无'
                                                    : change.oldValue}
                                                </span>
                                                <span className="mx-1 text-slate-300">→</span>
                                                <span className="text-blue-600">
                                                  {Array.isArray(change.newValue)
                                                    ? (change.newValue as string[]).length > 0
                                                      ? (change.newValue as string[])
                                                          .map((f) => {
                                                            const facility = FACILITY_LIST.find(
                                                              (fa) => fa.type === f
                                                            );
                                                            return facility?.label || f;
                                                          })
                                                          .join('、')
                                                      : '无'
                                                    : change.newValue}
                                                </span>
                                              </>
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {rooms.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm">暂无会议室</p>
                  <p className="text-xs mt-1">点击右上角"新增会议室"开始添加</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
