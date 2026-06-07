import { useEffect } from 'react';
import { X, DoorOpen, BarChart3 } from 'lucide-react';
import { RoomList } from './RoomList';
import { RoomRanking } from './RoomRanking';
import { useState } from 'react';

type DrawerTab = 'list' | 'ranking';

interface LeftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeftDrawer({ isOpen, onClose }: LeftDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('list');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTabChange = (tab: DrawerTab) => {
    setActiveTab(tab);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              会议室
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-shrink-0 border-b border-slate-100">
            <div className="flex">
              <button
                onClick={() => handleTabChange('list')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'list'
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <DoorOpen className="w-4 h-4" />
                会议室列表
              </button>
              <button
                onClick={() => handleTabChange('ranking')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'ranking'
                    ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                使用排行
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeTab === 'list' && <RoomList embedded />}
            {activeTab === 'ranking' && <RoomRanking embedded />}
          </div>
        </div>
      </div>
    </>
  );
}
