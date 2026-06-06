import { X, Calendar, Clock, Users, Building2, User, Phone, Trash2, MapPin, StickyNote } from 'lucide-react';
import { Booking } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import { formatDateTime, formatTime } from '../utils/dateUtils';

interface BookingDetailModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function BookingDetailModal({ booking, isOpen, onClose, onDelete }: BookingDetailModalProps) {
  const { getRoomById } = useBookingStore();
  
  if (!isOpen || !booking) return null;

  const room = getRoomById(booking.roomId);

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

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationText = `${durationHours}小时${durationMinutes > 0 ? durationMinutes + '分钟' : ''}`;

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
        <div
          className="p-6 text-white relative"
          style={{ backgroundColor: room?.color || '#3b82f6' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-bold mb-2 pr-10">{booking.title}</h2>
          <p className="text-white/80 text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            {room?.name}
          </p>
        </div>

        <div className="p-6 space-y-4">
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
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
          >
            关闭
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            取消预定
          </button>
        </div>
      </div>
    </div>
  );
}
