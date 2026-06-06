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
} from 'lucide-react';
import { Booking } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import { formatDateTime, formatTime } from '../utils/dateUtils';
import { format } from 'date-fns';

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
  const { getRoomById, getActiveRooms, updateBooking, checkConflict } = useBookingStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditFormData | null>(null);
  const [error, setError] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const activeRooms = getActiveRooms();

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setFormData(null);
      setError('');
      setConflictWarning('');
      setIsSubmitting(false);
      setSuccessMessage('');
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const room = getRoomById(booking.roomId);
  const selectedRoom = formData ? getRoomById(formData.roomId) : room;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm('确定要取消这个预定吗？')) {
      onDelete(booking.id);
    }
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

  useEffect(() => {
    if (!formData || !isEditing) return;

    const startDateTime = `${formData.date}T${formData.startTime}:00`;
    const endDateTime = `${formData.date}T${formData.endTime}:00`;

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      setConflictWarning('结束时间必须晚于开始时间');
    } else if (checkConflict(formData.roomId, startDateTime, endDateTime, booking.id)) {
      setConflictWarning('该时间段已有会议预定');
    } else {
      setConflictWarning('');
    }
  }, [formData?.startTime, formData?.endTime, formData?.date, formData?.roomId, isEditing, booking.id, checkConflict]);

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
    if (conflictWarning) {
      setError(conflictWarning);
      return;
    }

    setIsSubmitting(true);

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

    setTimeout(() => {
      setIsSubmitting(false);
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
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                disabled={isSubmitting || !!conflictWarning}
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
                    保存修改
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleStartEdit}
                className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                编辑改期
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                取消预定
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
