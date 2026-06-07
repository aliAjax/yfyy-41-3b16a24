import { useState } from 'react';
import {
  DoorOpen,
  Search,
  Plus,
  MoreHorizontal,
  Upload,
  Settings,
  Download,
  X,
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { ExportButton } from './ExportButton';

interface MobileActionBarProps {
  onOpenLeftDrawer: () => void;
  onOpenRightDrawer: (tab: 'finder' | 'form') => void;
}

export function MobileActionBar({ onOpenLeftDrawer, onOpenRightDrawer }: MobileActionBarProps) {
  const { setIsBatchImportModalOpen, setIsRoomManagementModalOpen } = useBookingStore();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleBatchImport = () => {
    setShowMoreMenu(false);
    setIsBatchImportModalOpen(true);
  };

  const handleRoomManagement = () => {
    setShowMoreMenu(false);
    setIsRoomManagementModalOpen(true);
  };

  return (
    <>
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setShowMoreMenu(false)}
        />
      )}

      {showMoreMenu && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
          <div className="p-2">
            <button
              onClick={handleBatchImport}
              className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-800">批量导入</p>
                <p className="text-xs text-slate-500">导入 Excel 预定数据</p>
              </div>
            </button>

            <button
              onClick={handleRoomManagement}
              className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-800">会议室管理</p>
                <p className="text-xs text-slate-500">添加、编辑、停用会议室</p>
              </div>
            </button>

            <div className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-800">导出数据</p>
                <p className="text-xs text-slate-500">导出预定记录为 Excel</p>
              </div>
              <ExportButton />
            </div>
          </div>

          <div className="border-t border-slate-100 p-2">
            <button
              onClick={() => setShowMoreMenu(false)}
              className="w-full py-3 text-slate-500 font-medium flex items-center justify-center gap-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" />
              取消
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={onOpenLeftDrawer}
            className="flex flex-col items-center gap-1 px-4 py-2 text-slate-500 hover:text-blue-600 transition-colors"
          >
            <DoorOpen className="w-5 h-5" />
            <span className="text-xs font-medium">会议室</span>
          </button>

          <button
            onClick={() => onOpenRightDrawer('finder')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-slate-500 hover:text-purple-600 transition-colors"
          >
            <Search className="w-5 h-5" />
            <span className="text-xs font-medium">查找</span>
          </button>

          <button
            onClick={() => onOpenRightDrawer('form')}
            className="flex flex-col items-center gap-1 px-6 py-2 -mt-6"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-blue-600">新建预定</span>
          </button>

          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              showMoreMenu ? 'text-slate-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-xs font-medium">更多</span>
          </button>
        </div>
      </nav>
    </>
  );
}
