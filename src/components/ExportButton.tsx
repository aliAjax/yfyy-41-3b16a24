import { Download } from 'lucide-react';
import { useState } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { exportBookingsToCsv } from '../utils/exportUtils';

export function ExportButton() {
  const { bookings, viewMode, currentDate, selectedRoomId, getRoomById, rooms, selectedDepartment } = useBookingStore();
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const room = getRoomById(selectedRoomId);
  const roomName = room?.name || '';

  const handleExport = () => {
    const result = exportBookingsToCsv(bookings, viewMode, currentDate, selectedRoomId, rooms, selectedDepartment);
    setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors shadow-md"
        title={`导出 ${roomName} 的${viewMode === 'day' ? '日' : '周'}日程`}
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">导出日程</span>
      </button>
      {message && (
        <div
          className={`absolute top-full mt-2 right-0 px-3 py-2 rounded-lg text-xs font-medium shadow-lg whitespace-nowrap z-50 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-amber-100 text-amber-700 border border-amber-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
