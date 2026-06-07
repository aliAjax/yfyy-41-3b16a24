import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { RoomFinder } from './RoomFinder';
import { BookingForm } from './BookingForm';

type PanelTab = 'finder' | 'form';

interface RightPanelProps {
  defaultTab?: PanelTab;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export function RightPanel({ defaultTab = 'form', showCloseButton = false, onClose }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>(defaultTab);

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex-shrink-0 border-b border-slate-100">
        <div className="flex">
          <button
            onClick={() => setActiveTab('finder')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'finder'
                ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">查找会议室</span>
            <span className="sm:hidden">查找</span>
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'form'
                ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">新建预定</span>
            <span className="sm:hidden">新建</span>
          </button>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="px-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'finder' && (
          <div className="h-full overflow-y-auto">
            <RoomFinder embedded />
          </div>
        )}
        {activeTab === 'form' && (
          <div className="h-full overflow-y-auto">
            <BookingForm embedded />
          </div>
        )}
      </div>
    </div>
  );
}
