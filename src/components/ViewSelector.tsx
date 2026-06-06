import { useState, useRef, useEffect } from 'react';
import { BookmarkPlus, ChevronDown, Trash2, Check } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { SavedView } from '../types';

export function ViewSelector() {
  const {
    savedViews,
    activeViewId,
    applyView,
    deleteSavedView,
    setIsSaveViewModalOpen,
  } = useBookingStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewClick = (view: SavedView) => {
    applyView(view);
    setIsDropdownOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, viewId: string) => {
    e.stopPropagation();
    deleteSavedView(viewId);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm font-medium text-slate-500">常用视图:</div>
      
      <div className="flex items-center gap-1">
        {savedViews.slice(0, 4).map((view) => (
          <button
            key={view.id}
            onClick={() => handleViewClick(view)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 flex items-center gap-1 ${
              view.id === activeViewId
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {view.name}
          </button>
        ))}

        {savedViews.length > 4 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-2 py-1.5 text-xs rounded-lg font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200 flex items-center gap-1"
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                {savedViews.slice(4).map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 cursor-pointer group"
                    onClick={() => handleViewClick(view)}
                  >
                    <div className="flex items-center gap-2">
                      {view.id === activeViewId && (
                        <Check className="w-3 h-3 text-blue-500" />
                      )}
                      <span className={`text-sm ${
                        view.id === activeViewId ? 'text-blue-600 font-medium' : 'text-slate-700'
                      }`}>
                        {view.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, view.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setIsSaveViewModalOpen(true)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all duration-200 border border-emerald-200"
      >
        <BookmarkPlus className="w-3 h-3" />
        保存视图
      </button>
    </div>
  );
}
