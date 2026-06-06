import { Download } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { exportBookingsToCsv } from '../utils/exportUtils';

export function ExportButton() {
  const { bookings, viewMode, currentDate, selectedRoomId, getRoomById, rooms } = useBookingStore();

  const room = getRoomById(selectedRoomId);
  const roomName = room?.name || '';

  const handleExport = () => {
    exportBookingsToCsv(bookings, viewMode, currentDate, selectedRoomId, rooms);
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
