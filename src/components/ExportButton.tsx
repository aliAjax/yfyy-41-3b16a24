import { Download } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { exportBookingsToCsv } from '../utils/exportUtils';
import { MEETING_ROOMS } from '../constants';

export function ExportButton() {
  const { bookings, viewMode, currentDate, selectedRoomId } = useBookingStore();

  const room = MEETING_ROOMS.find((r) => r.id === selectedRoomId);
  const roomName = room?.name || '';

  const handleExport = () => {
    exportBookingsToCsv(bookings, viewMode, currentDate, selectedRoomId);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors shadow-md"
      title={`导出 ${roomName} 的${viewMode === 'day' ? '日' : '周'}日程`}
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">导出日程</span>
    </button>
  );
}
