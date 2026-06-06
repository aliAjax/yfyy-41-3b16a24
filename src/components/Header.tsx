import { Calendar, ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Upload, Settings } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { formatDate } from '../utils/dateUtils';
import { addDays, startOfWeek, addWeeks } from 'date-fns';
import { ExportButton } from './ExportButton';

export function Header() {
  const { viewMode, setViewMode, currentDate, setCurrentDate, setIsBatchImportModalOpen, setIsRoomManagementModalOpen } = useBookingStore();

  const handlePrev = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else {
      setCurrentDate(addWeeks(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateDisplay = () => {
    if (viewMode === 'day') {
      return formatDate(currentDate, 'yyyy年MM月dd日 EEEE');
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      return `${formatDate(weekStart, 'MM月dd日')} - ${formatDate(weekEnd, 'MM月dd日 yyyy年')}`;
    }
  };

  return (
    <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">会议室预定系统</h1>
            <p className="text-xs text-slate-400">Meeting Room Booking System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'day'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              日视图
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'week'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              周视图
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-9 h-9 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-sm font-medium transition-colors"
            >
              今天
            </button>
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBatchImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              <Upload className="w-4 h-4" />
              批量导入
            </button>
            <button
              onClick={() => setIsRoomManagementModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              <Settings className="w-4 h-4" />
              会议室管理
            </button>
            <ExportButton />
            <div className="text-right">
              <p className="text-sm font-medium">{getDateDisplay()}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
