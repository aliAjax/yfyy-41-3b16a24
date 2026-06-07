import { useEffect, useState } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { RoomFinder } from './RoomFinder';
import { BookingForm } from './BookingForm';

type DrawerTab = 'finder' | 'form';

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: DrawerTab;
}

export function RightDrawer({ isOpen, onClose, defaultTab = 'form' }: RightDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>(defaultTab);

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

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 border-b border-slate-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab('finder')}
                className={`flex-1 px-3 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'finder'
                    ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Search className="w-4 h-4" />
                查找
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`flex-1 px-3 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'form'
                    ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Plus className="w-4 h-4" />
                新建
              </button>
              <button
                onClick={onClose}
                className="px-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeTab === 'finder' && <RoomFinder embedded />}
            {activeTab === 'form' && <BookingForm embedded />}
          </div>
        </div>
      </div>
    </>
  );
}
