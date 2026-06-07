import { X, AlertTriangle, CheckCircle, XCircle, SkipForward, Ban } from 'lucide-react';
import { BookingConflictInfo } from '../types';

interface RecurrenceConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: BookingConflictInfo[];
  onSkipConflicts: () => void;
  onCancel: () => void;
  title?: string;
}

export function RecurrenceConflictModal({
  isOpen,
  onClose,
  conflicts,
  onSkipConflicts,
  onCancel,
  title = '重复预订冲突预览',
}: RecurrenceConflictModalProps) {
  if (!isOpen) return null;

  const conflictItems = conflicts.filter((c) => c.hasConflict);
  const okItems = conflicts.filter((c) => !c.hasConflict);
  const totalCount = conflicts.length;
  const conflictCount = conflictItems.length;
  const okCount = okItems.length;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="p-6 bg-amber-500 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-white/80 text-sm">
                共 {totalCount} 场预定，{conflictCount} 场存在冲突
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 p-3 bg-green-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-600">{okCount}</p>
              <p className="text-xs text-green-600">可预定</p>
            </div>
            <div className="flex-1 p-3 bg-red-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-red-600">{conflictCount}</p>
              <p className="text-xs text-red-600">有冲突</p>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
            <div className="sticky top-0 bg-slate-50 px-4 py-2 border-b border-slate-200 z-10">
              <p className="text-sm font-medium text-slate-600">预定详情</p>
            </div>
            <div className="divide-y divide-slate-100">
              {conflicts.map((item, index) => (
                <div
                  key={index}
                  className={`px-4 py-3 flex items-center gap-3 ${
                    item.hasConflict ? 'bg-red-50/50' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {item.hasConflict ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {item.date}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.startTime} - {item.endTime}
                    </p>
                    {item.hasConflict && item.conflictWith && (
                      <p className="text-xs text-red-600 mt-1">
                        冲突：{item.conflictWith.title}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {item.hasConflict ? (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                        冲突
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        正常
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Ban className="w-4 h-4" />
            取消创建
          </button>
          <button
            onClick={onSkipConflicts}
            disabled={okCount === 0}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
          >
            <SkipForward className="w-4 h-4" />
            跳过冲突创建
          </button>
        </div>
      </div>
    </div>
  );
}
