import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Building2,
  User,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle,
  Send,
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { MEETING_ROOMS } from '../constants';
import { format } from 'date-fns';

export function BookingForm() {
  const { selectedRoomId, currentDate, addBooking, checkConflict, prefilledFormData, setPrefilledFormData } = useBookingStore();
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    attendees: 1,
    date: format(currentDate, 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    contact: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictWarning, setConflictWarning] = useState('');

  const room = MEETING_ROOMS.find((r) => r.id === selectedRoomId);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: format(currentDate, 'yyyy-MM-dd'),
    }));
  }, [currentDate]);

  useEffect(() => {
    if (prefilledFormData) {
      setFormData((prev) => {
        const newData = { ...prev };
        if (prefilledFormData.attendees !== undefined) {
          newData.attendees = prefilledFormData.attendees;
        }
        if (prefilledFormData.startTime) {
          const startDate = new Date(prefilledFormData.startTime);
          newData.date = format(startDate, 'yyyy-MM-dd');
          newData.startTime = format(startDate, 'HH:mm');
        }
        if (prefilledFormData.endTime) {
          const endDate = new Date(prefilledFormData.endTime);
          newData.endTime = format(endDate, 'HH:mm');
        }
        return newData;
      });
      setError('');
      setSuccess(false);
    }
  }, [prefilledFormData]);

  useEffect(() => {
    if (formData.startTime && formData.endTime && formData.date) {
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = `${formData.date}T${formData.endTime}:00`;
      
      if (new Date(startDateTime) >= new Date(endDateTime)) {
        setConflictWarning('结束时间必须晚于开始时间');
      } else if (checkConflict(selectedRoomId, startDateTime, endDateTime)) {
        setConflictWarning('该时间段已有会议预定');
      } else {
        setConflictWarning('');
      }
    }
  }, [formData.startTime, formData.endTime, formData.date, selectedRoomId, checkConflict]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
    setError('');
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    if (room && formData.attendees > room.capacity) {
      setError(`参会人数超出会议室容量（最多${room.capacity}人）`);
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
    
    const result = addBooking({
      roomId: selectedRoomId,
      title: formData.title,
      department: formData.department,
      attendees: formData.attendees,
      startTime: `${formData.date}T${formData.startTime}:00`,
      endTime: `${formData.date}T${formData.endTime}:00`,
      contact: formData.contact,
      phone: formData.phone,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      if (result.success) {
        setSuccess(true);
        setError('');
        setPrefilledFormData(null);
        setTimeout(() => setSuccess(false), 3000);
        setFormData((prev) => ({
          ...prev,
          title: '',
          attendees: 1,
          contact: '',
          phone: '',
        }));
      } else {
        setError(result.message);
      }
    }, 500);
  };

  const timeOptions = [];
  for (let h = 8; h < 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  return (
    <div className="w-80 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
          新建预定
        </h2>
      </div>

      <div className="px-6 flex-shrink-0">
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm animate-pulse">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>预定成功！</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {conflictWarning && !success && !error && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{conflictWarning}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-400" />
            会议主题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="请输入会议主题"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            使用科室 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="请输入使用科室"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            参会人数 <span className="text-red-500">*</span>
            {room && (
              <span className="text-xs text-slate-400 ml-auto">
                最多{room.capacity}人
              </span>
            )}
          </label>
          <input
            type="number"
            name="attendees"
            value={formData.attendees}
            onChange={handleChange}
            min="1"
            max={room?.capacity || 100}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            预定日期
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
            onChange={handleChange}
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
            onChange={handleChange}
            placeholder="请输入联系电话（选填）"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !!conflictWarning}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              提交中...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              提交预定
            </>
          )}
        </button>
      </form>
    </div>
  );
}
