import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  Building2,
  User,
  Phone,
  Trash2,
  MapPin,
  StickyNote,
  Edit3,
  Save,
  XCircle,
  AlertCircle,
  FileText,
  Copy,
  Repeat,
  Layers,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Booking, BookingConflictInfo } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import { formatDateTime, formatTime, getRecurrenceText } from '../utils/dateUtils';
import { format } from 'date-fns';
import { RecurrenceConflictModal } from './RecurrenceConflictModal';

interface BookingDetailModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

interface EditFormData {
  title: string;
  department: string;
  attendees: number;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  contact: string;
  phone: string;
  remarks: string;
}

export function BookingDetailModal({ booking, isOpen, onClose, onDelete }: BookingDetailModalProps) {
  const { getRoomById, getActiveRooms, updateBooking, checkConflict, setPrefilledFormData, setIsModalOpen, setSelectedBooking, getRecurrenceBookings, deleteRecurrenceSeries, updateRecurrenceSeries, checkRecurrenceConflicts, getBookingChangeLogs } = useBookingStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');
  const [formData, setFormData] = useState<EditFormData | null>(null);
  const [error, setError] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfos, setConflictInfos] = useState<BookingConflictInfo[]>([]);
  const [showChangeLogs, setShowChangeLogs] = useState(false);

  const activeRooms = getActiveRooms();

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditMode('single');
      setFormData(null);
      setError('');
      setConflictWarning('');
      setIsSubmitting(false);
      setSuccessMessage('');
      setShowDeleteConfirm(false);
      setShowConflictModal(false);
      setConflictInfos([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!formData || !isEditing || !booking) return;

    const startDateTime = `${formData.date}T${formData.startTime}:00`;
    const endDateTime = `${formData.date}T${formData.endTime}:00`;

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      setConflictWarning('结束时间必须晚于开始时间');
    } else if (checkConflict(formData.roomId, startDateTime, endDateTime, booking.id)) {
      setConflictWarning('该时间段已有会议预定');
    } else {
      setConflictWarning('');
    }
  }, [formData, isEditing, booking, checkConflict]);

  if (!isOpen || !booking) return null;

  const room = getRoomById(booking.roomId);
  const selectedRoom = formData ? getRoomById(formData.roomId) : room;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isRecurring = booking?.recurrenceId ? true : false;
  const seriesBookings = booking?.recurrenceId ? getRecurrenceBookings(booking.recurrenceId) : [];
  const seriesCount = seriesBookings.length;

  const handleDeleteSingle = () => {
    onDelete(booking.id);
    setShowDeleteConfirm(false);
  };

  const handleDeleteSeries = () => {
    if (booking?.recurrenceId) {
      deleteRecurrenceSeries(booking.recurrenceId);
    }
    setShowDeleteConfirm(false);
  };

  const handleDelete = () => {
    if (isRecurring) {
      setShowDeleteConfirm(true);
    } else {
      if (window.confirm('确定要取消这个预定吗？')) {
        onDelete(booking.id);
      }
    }
  };

  const handleCopyBooking = () => {
    setPrefilledFormData({
      title: booking.title,
      department: booking.department,
      attendees: booking.attendees,
      contact: booking.contact,
      phone: booking.phone,
      remarks: booking.remarks || '',
    });
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleStartEdit = () => {
    const startDate = new Date(booking.startTime);
    const endDate = new Date(booking.endTime);
    setFormData({
      title: booking.title,
      department: booking.department,
      attendees: booking.attendees,
      roomId: booking.roomId,
      date: format(startDate, 'yyyy-MM-dd'),
      startTime: format(startDate, 'HH:mm'),
      endTime: format(endDate, 'HH:mm'),
      contact: booking.contact,
      phone: booking.phone,
      remarks: booking.remarks || '',
    });
    setError('');
    setConflictWarning('');
    setSuccessMessage('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData(null);
    setError('');
    setConflictWarning('');
    setSuccessMessage('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value, type } = e.target;
    setFormData((prev) =>
      prev ? { ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value } : prev
    );
    setError('');
    setSuccessMessage('');
  };

  const handleSaveSingle = () => {
    if (!formData || !booking) return;

    const result = updateBooking(booking.id, {
      roomId: formData.roomId,
      title: formData.title,
      department: formData.department,
      attendees: formData.attendees,
      startTime: `${formData.date}T${formData.startTime}:00`,
      endTime: `${formData.date}T${formData.endTime}:00`,
      contact: formData.contact,
      phone: formData.phone,
      remarks: formData.remarks,
    });

    if (result.success) {
      setSuccessMessage(result.message);
      setError('');
      setTimeout(() => {
        setIsEditing(false);
        setFormData(null);
        setSuccessMessage('');
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  const handleSaveSeries = () => {
    if (!formData || !booking || !booking.recurrenceId) return;

    const recurrenceEndDate = booking.recurrenceEndDate || formData.date;

    const conflicts = checkRecurrenceConflicts(
      formData.roomId,
      formData.date,
      recurrenceEndDate,
      formData.startTime,
      formData.endTime,
      booking.recurrenceType || 'weekly',
      booking.recurrenceId
    );

    const hasConflicts = conflicts.some((c) => c.hasConflict);

    if (hasConflicts) {
      setConflictInfos(conflicts);
      setShowConflictModal(true);
      return;
    }

    const result = updateRecurrenceSeries(
      booking.recurrenceId,
      {
        roomId: formData.roomId,
        title: formData.title,
        department: formData.department,
        attendees: formData.attendees,
        startTime: `${formData.date}T${formData.startTime}:00`,
        endTime: `${formData.date}T${formData.endTime}:00`,
        contact: formData.contact,
        phone: formData.phone,
        remarks: formData.remarks,
      },
      false
    );

    if (result.success) {
      setSuccessMessage(result.message);
      setError('');
      setTimeout(() => {
        setIsEditing(false);
        setFormData(null);
        setSuccessMessage('');
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  const handleSkipConflicts = () => {
    if (!formData || !booking || !booking.recurrenceId) return;

    const result = updateRecurrenceSeries(
      booking.recurrenceId,
      {
        roomId: formData.roomId,
        title: formData.title,
        department: formData.department,
        attendees: formData.attendees,
        startTime: `${formData.date}T${formData.startTime}:00`,
        endTime: `${formData.date}T${formData.endTime}:00`,
        contact: formData.contact,
        phone: formData.phone,
        remarks: formData.remarks,
      },
      true
    );

    setShowConflictModal(false);
    setConflictInfos([]);

    if (result.success) {
      setSuccessMessage(result.message);
      setError('');
      setTimeout(() => {
        setIsEditing(false);
        setFormData(null);
        setSuccessMessage('');
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  const handleCancelConflictModal = () => {
    setShowConflictModal(false);
    setConflictInfos([]);
  };

  const handleSave = () => {
    if (!formData) return;

    if (!formData.title.trim()) {
      setError('请输入会议主题');
      return;
    }
    if (!formData.department.trim()) {
      setError('请输入使用科室');
      return;
    }
    if (formData.attendees <= 0) {
      setError('参会人数必须大于0');
      return;
    }
    if (selectedRoom && formData.attendees > selectedRoom.capacity) {
      setError(`参会人数超出会议室容量（最多${selectedRoom.capacity}人）`);
      return;
    }
    if (!formData.contact.trim()) {
      setError('请输入联系人');
      return;
    }
    if (conflictWarning && editMode === 'single') {
      setError(conflictWarning);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      if (editMode === 'series' && isRecurring) {
        handleSaveSeries();
      } else {
        handleSaveSingle();
      }
    }, 500);
  };

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationText = `${durationHours}小时${durationMinutes > 0 ? durationMinutes + '分钟' : ''}`;

  const timeOptions = [];
  for (let h = 8; h < 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  const displayRoom = isEditing ? selectedRoom : room;
  const headerColor = displayRoom?.color || '#3b82f6';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="p-6 text-white relative" style={{ backgroundColor: headerColor }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {isEditing && formData ? (
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              className="text-xl font-bold mb-2 pr-10 bg-white/20 text-white placeholder-white/60 px-3 py-1.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-white/40"
              placeholder="会议主题"
            />
          ) : (
            <h2 className="text-xl font-bold mb-2 pr-10">{booking.title}</h2>
          )}

          {isEditing && formData ? (
            <select
              name="roomId"
              value={formData.roomId}
              onChange={handleFormChange}
              className="text-sm bg-white/20 text-white px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
            >
              {activeRooms.map((r) => (
                <option key={r.id} value={r.id} className="text-slate-800">
                  {r.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-white/80 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              {room?.name}
            </p>
          )}
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm animate-pulse">
              <Save className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {conflictWarning && isEditing && !error && !successMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{conflictWarning}</span>
            </div>
          )}

          {isEditing && formData ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  使用科室 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  placeholder="请输入使用科室"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  参会人数 <span className="text-red-500">*</span>
                  {selectedRoom && (
                    <span className="text-xs text-slate-400 ml-auto">
                      最多{selectedRoom.capacity}人
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  name="attendees"
                  value={formData.attendees}
                  onChange={handleFormChange}
                  min="1"
                  max={selectedRoom?.capacity || 100}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {isRecurring && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5" />
                    这是重复预订系列中的一场
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditMode('single')}
                      className={`py-2 text-xs font-medium rounded-lg transition-all ${
                        editMode === 'single'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-blue-200 hover:border-blue-400'
                      }`}
                    >
                      仅修改此场
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode('series')}
                      className={`py-2 text-xs font-medium rounded-lg transition-all ${
                        editMode === 'series'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-blue-200 hover:border-blue-400'
                      }`}
                    >
                      修改整个系列
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  预定日期
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  disabled={editMode === 'series' && isRecurring}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    开始时间
                  </label>
                  <select
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    结束时间
                  </label>
                  <select
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  联系人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleFormChange}
                  placeholder="请输入联系人姓名"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  联系电话
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="请输入联系电话（选填）"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  预定备注
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleFormChange}
                  placeholder="请输入会议备注（选填）"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">日期</p>
                    <p className="text-sm font-medium text-slate-700">
                      {formatDateTime(booking.startTime).split(' ')[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">时长</p>
                    <p className="text-sm font-medium text-slate-700">{durationText}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-500">会议时间</span>
                </div>
                <p className="text-lg font-semibold text-slate-800">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </p>
              </div>

              {isRecurring && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">重复预订系列</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {getRecurrenceText(booking)} · 共 {seriesCount} 场
                    </span>
                  </div>
                  {booking.recurrenceEndDate && (
                    <p className="text-xs text-blue-500 mt-1">
                      至 {booking.recurrenceEndDate} 结束
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">使用科室</p>
                    <p className="text-sm text-slate-700">{booking.department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">参会人数</p>
                    <p className="text-sm text-slate-700">{booking.attendees} 人</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">联系人</p>
                    <p className="text-sm text-slate-700">{booking.contact}</p>
                  </div>
                </div>

                {booking.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">联系电话</p>
                      <p className="text-sm text-slate-700">{booking.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">会议室位置</p>
                    <p className="text-sm text-slate-700">{room?.location}</p>
                  </div>
                </div>

                {booking.remarks && (
                  <div className="flex items-start gap-3">
                    <StickyNote className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 mb-1">预定备注</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                        {booking.remarks}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowChangeLogs(!showChangeLogs)}
                    className="w-full flex items-center justify-between py-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      变更记录
                    </span>
                    {showChangeLogs ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showChangeLogs && (
                    <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
                      {getBookingChangeLogs(booking.id).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">暂无变更记录</p>
                      ) : (
                        getBookingChangeLogs(booking.id).map((log) => (
                          <div
                            key={log.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  log.type === 'create'
                                    ? 'bg-green-100 text-green-700'
                                    : log.type === 'update'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {log.type === 'create'
                                  ? '新建'
                                  : log.type === 'update'
                                  ? '修改'
                                  : '取消'}
                              </span>
                              <span className="text-xs text-slate-400">
                                {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm')}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-700 mb-1.5">
                              {log.description}
                            </p>
                            {log.changes.length > 0 && (
                              <div className="space-y-1">
                                {log.changes.map((change, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-slate-500 flex items-start gap-1"
                                  >
                                    <span className="text-slate-400">•</span>
                                    <span>
                                      <span className="text-slate-600">{change.label}：</span>
                                      {log.type === 'create' ? (
                                        <span className="text-green-600">
                                          {Array.isArray(change.newValue)
                                            ? change.newValue.join('、')
                                            : change.newValue}
                                        </span>
                                      ) : log.type === 'cancel' ? (
                                        <span className="text-red-600">
                                          {String(change.newValue)}
                                        </span>
                                      ) : (
                                        <>
                                          <span className="text-slate-400 line-through">
                                            {Array.isArray(change.oldValue)
                                              ? change.oldValue.join('、')
                                              : change.oldValue}
                                          </span>
                                          <span className="mx-1">→</span>
                                          <span className="text-blue-600">
                                            {Array.isArray(change.newValue)
                                              ? change.newValue.join('、')
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
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting || (!!conflictWarning && editMode === 'single')}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editMode === 'series' && isRecurring ? '保存系列' : '保存修改'}
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onClose}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleCopyBooking}
                className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                复制
              </button>
              <button
                onClick={handleStartEdit}
                className="py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                编辑改期
              </button>
              <button
                onClick={handleDelete}
                className="py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isRecurring ? '取消系列' : '取消预定'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && booking && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setShowDeleteConfirm(false)}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            style={{ animation: 'slideUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">取消重复预订</h3>
                  <p className="text-sm text-slate-500">共 {seriesCount} 场预定</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                请选择要取消的范围：
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleDeleteSingle}
                  className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-xl transition-colors text-left flex items-center justify-between"
                >
                  <span>仅取消这一场</span>
                  <span className="text-xs text-slate-400">1 场</span>
                </button>
                <button
                  onClick={handleDeleteSeries}
                  className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors text-left flex items-center justify-between"
                >
                  <span>取消整个系列</span>
                  <span className="text-xs text-red-400">{seriesCount} 场</span>
                </button>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <RecurrenceConflictModal
        isOpen={showConflictModal}
        onClose={handleCancelConflictModal}
        conflicts={conflictInfos}
        onSkipConflicts={handleSkipConflicts}
        onCancel={handleCancelConflictModal}
        title="更新冲突预览"
      />
    </div>
  );
}
