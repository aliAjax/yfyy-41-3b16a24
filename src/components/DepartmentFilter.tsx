import { Building2 } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';

export function DepartmentFilter() {
  const { selectedDepartment, setSelectedDepartment, bookings } = useBookingStore();
  
  const departments = [...new Set(bookings.map((b) => b.department))].filter(Boolean).sort();
  const allDepartments = ['all', ...departments];

  return (
    <div className="rounded-xl p-2 md:p-3">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500" />
        <span className="text-xs md:text-sm font-medium text-slate-700">科室筛选</span>
      </div>
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {allDepartments.map((dept) => {
          const isSelected = selectedDepartment === dept;
          const label = dept === 'all' ? '全部' : dept;
          
          return (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-2 py-1 text-xs rounded-lg font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
