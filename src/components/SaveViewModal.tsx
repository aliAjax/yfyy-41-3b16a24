import { useState, useEffect } from 'react';
import { X, Save, BookmarkPlus } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';

export function SaveViewModal() {
  const {
    isSaveViewModalOpen,
    setIsSaveViewModalOpen,
    addSavedView,
    selectedRoomId,
    viewMode,
    currentDate,
    selectedDepartment,
    getRoomById,
  } = useBookingStore();

  const [viewName, setViewName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isSaveViewModalOpen) {
      setViewName('');
      setError('');
      setIsSubmitting(false);
    } else {
      const room = getRoomById(selectedRoomId);
      if (room) {
        const deptLabel = selectedDepartment === 'all' ? '全部科室' : selectedDepartment;
        const viewLabel = viewMode === 'day' ? '日视图' : '周视图';
        setViewName(`${room.name} - ${viewLabel} - ${deptLabel}`);
      }
    }
  }, [isSaveViewModalOpen, selectedRoomId, viewMode, selectedDepartment, getRoomById]);

  if (!isSaveViewModalOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsSaveViewModalOpen(false);
    }
  };

  const handleSave = () => {
    if (!viewName.trim()) {
      setError('请输入视图名称');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      addSavedView(viewName.trim());
      setIsSubmitting(false);
    }, 300);
  };

  const room = getRoomById(selectedRoomId);
  const deptLabel = selectedDepartment === 'all' ? '全部科室' : selectedDepartment;
  const viewLabel = viewMode === 'day' ? '日视图' : '周视图';

  const formatDateRange = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    } else {
      const start = new Date(currentDate);
      const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
      start.setDate(start.getDate() - day);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }
  };

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
        <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white relative">
          <button
            onClick={() => setIsSaveViewModalOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">保存视图</h2>
              <p className="text-white/80 text-sm">将当前配置保存为常用视图</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              视图名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={viewName}
              onChange={(e) => {
                setViewName(e.target.value);
                setError('');
              }}
              placeholder="请输入视图名称"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-slate-600">视图详情预览</p>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-1">会议室</p>
                <p className="font-medium text-slate-700">{room?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">视图模式</p>
                <p className="font-medium text-slate-700">{viewLabel}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-1">日期范围</p>
                <p className="font-medium text-slate-700">{formatDateRange()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-1">科室筛选</p>
                <p className="font-medium text-slate-700">{deptLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => setIsSaveViewModalOpen(false)}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存视图
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
