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
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Play,
  Plus,
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { MEETING_ROOMS } from '../constants';
import { format } from 'date-fns';
import { BookingTemplate } from '../types';
import {
  getTemplatesFromStorage,
  addTemplateToStorage,
  deleteTemplateFromStorage,
} from '../utils/storage';

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
    remarks: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictWarning, setConflictWarning] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<BookingTemplate[]>([]);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateError, setTemplateError] = useState('');

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
    setError('');
    setSuccess(false);
  };

  const loadTemplates = () => {
    const data = getTemplatesFromStorage();
    setTemplates(
      data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleAddTemplate = () => {
    if (!newTemplateName.trim()) {
      setTemplateError('请输入模板名称');
      return;
    }
    if (!formData.title.trim()) {
      setTemplateError('会议主题不能为空');
      return;
    }
    if (!formData.department.trim()) {
      setTemplateError('使用科室不能为空');
      return;
    }
    if (!formData.contact.trim()) {
      setTemplateError('联系人不能为空');
      return;
    }

    addTemplateToStorage({
      name: newTemplateName.trim(),
      title: formData.title,
      department: formData.department,
      attendees: formData.attendees,
      contact: formData.contact,
      phone: formData.phone,
      remarks: formData.remarks,
    });

    setNewTemplateName('');
    setIsAddingTemplate(false);
    setTemplateError('');
    loadTemplates();
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplateFromStorage(id);
    loadTemplates();
  };

  const handleApplyTemplate = (template: BookingTemplate) => {
    setFormData((prev) => ({
      ...prev,
      title: template.title,
      department: template.department,
      attendees: template.attendees,
      contact: template.contact,
      phone: template.phone,
      remarks: template.remarks,
    }));
    setShowTemplates(false);
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
      remarks: formData.remarks,
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
          remarks: '',
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
            新建预定
          </h2>
          <button
            onClick={() => {
              setShowTemplates(!showTemplates);
              setIsAddingTemplate(false);
              setTemplateError('');
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showTemplates
                ? 'bg-amber-100 text-amber-700'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <BookmarkPlus className="w-4 h-4" />
            模板
            {showTemplates ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {showTemplates && (
        <div className="px-6 pb-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-amber-800">常用模板</span>
              {!isAddingTemplate && (
                <button
                  onClick={() => setIsAddingTemplate(true)}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  保存当前
                </button>
              )}
            </div>

            {isAddingTemplate && (
              <div className="mb-3">
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => {
                    setNewTemplateName(e.target.value);
                    setTemplateError('');
                  }}
                  placeholder="请输入模板名称"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent mb-2"
                  autoFocus
                />
                {templateError && (
                  <p className="text-xs text-red-600 mb-2">{templateError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTemplate}
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingTemplate(false);
                      setNewTemplateName('');
                      setTemplateError('');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg border border-amber-200 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {templates.length === 0 ? (
              <div className="text-center py-4 text-amber-600">
                <p className="text-xs">暂无模板</p>
                <p className="text-xs mt-1 opacity-70">点击"保存当前"保存常用信息</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-2.5 bg-white border border-amber-200 rounded-lg hover:border-amber-400 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-medium text-slate-800 truncate flex-1">
                        {template.name}
                      </span>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-0.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-1 flex-shrink-0"
                        title="删除模板"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mb-2 line-clamp-1">
                      {template.title} · {template.department}
                    </div>
                    <button
                      onClick={() => handleApplyTemplate(template)}
                      className="w-full py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      应用
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-400" />
            预定备注
          </label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="请输入会议备注（选填）"
            rows={3}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
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
