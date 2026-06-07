import { useState } from 'react';
import {
  Search,
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  DoorOpen,
  ArrowRight,
  Sparkles,
  Clock as ClockIcon,
  Projector,
  Video,
  Square,
  Phone,
  Filter,
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { MeetingRoom, RoomRecommendation, AdjacentTimeSlot, CapacityMatchLevel, FacilityType } from '../types';
import { format } from 'date-fns';
import { BUSINESS_START_HOUR, BUSINESS_END_HOUR, FACILITY_LIST } from '../constants';
import { cn } from '../lib/utils';

const getFacilityIcon = (iconName: string) => {
  switch (iconName) {
    case 'projector':
      return <Projector className="w-3 h-3" />;
    case 'video':
      return <Video className="w-3 h-3" />;
    case 'square':
      return <Square className="w-3 h-3" />;
    case 'phone':
      return <Phone className="w-3 h-3" />;
    default:
      return null;
  }
};

interface RoomFinderProps {
  embedded?: boolean;
}

export function RoomFinder({ embedded = false }: RoomFinderProps) {
  const {
    findAvailableRooms,
    setSelectedRoomId,
    setCurrentDate,
    setPrefilledFormData,
  } = useBookingStore();

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    attendees: 5,
    selectedFacilities: [] as FacilityType[],
  });

  const [results, setResults] = useState<RoomRecommendation[]>([]);
  const [adjacentSuggestions, setAdjacentSuggestions] = useState<AdjacentTimeSlot[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const timeOptions = [];
  for (let h = BUSINESS_START_HOUR; h < BUSINESS_END_HOUR; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }
  timeOptions.push(`${BUSINESS_END_HOUR.toString().padStart(2, '0')}:00`);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 1 : value,
    }));
    setError('');
  };

  const handleFacilityToggle = (facilityType: FacilityType) => {
    setFormData((prev) => {
      const hasFacility = prev.selectedFacilities.includes(facilityType);
      return {
        ...prev,
        selectedFacilities: hasFacility
          ? prev.selectedFacilities.filter((f) => f !== facilityType)
          : [...prev.selectedFacilities, facilityType],
      };
    });
    setError('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

    if (startDateTime >= endDateTime) {
      setError('结束时间必须晚于开始时间');
      return;
    }

    if (formData.attendees <= 0) {
      setError('参会人数必须大于0');
      return;
    }

    const finderResult = findAvailableRooms(
      formData.date,
      formData.startTime,
      formData.endTime,
      formData.attendees,
      formData.selectedFacilities
    );

    setResults(finderResult.recommendations);
    setAdjacentSuggestions(finderResult.adjacentSuggestions);
    setHasSearched(true);
    setError('');
  };

  const handleRoomSelect = (room: MeetingRoom) => {
    setSelectedRoomId(room.id);
    setCurrentDate(new Date(formData.date));
    setPrefilledFormData({
      roomId: room.id,
      startTime: `${formData.date}T${formData.startTime}:00`,
      endTime: `${formData.date}T${formData.endTime}:00`,
      attendees: formData.attendees,
    });
  };

  const handleAdjacentSelect = (suggestion: AdjacentTimeSlot) => {
    setSelectedRoomId(suggestion.room.id);
    setCurrentDate(new Date(formData.date));
    setPrefilledFormData({
      roomId: suggestion.room.id,
      startTime: `${formData.date}T${suggestion.startTime}:00`,
      endTime: `${formData.date}T${suggestion.endTime}:00`,
      attendees: formData.attendees,
    });
  };

  const getMatchBadgeColor = (level: CapacityMatchLevel) => {
    switch (level) {
      case 'perfect':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'large':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'far':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden',
        embedded
          ? 'w-full h-full'
          : 'w-full min-w-0 bg-white rounded-2xl shadow-sm border border-slate-100 max-h-[30vh]'
      )}
    >
      <div className="p-4 md:p-6 pb-3 md:pb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
          空闲会议室查找
        </h2>
      </div>

      <form onSubmit={handleSearch} className="px-6 pb-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            预定日期
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              开始时间
            </label>
            <select
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              结束时间
            </label>
            <select
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            参会人数
          </label>
          <input
            type="number"
            name="attendees"
            value={formData.attendees}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            设备筛选
          </label>
          <div className="flex flex-wrap gap-2">
            {FACILITY_LIST.map((facility) => {
              const isSelected = formData.selectedFacilities.includes(facility.type);
              return (
                <button
                  key={facility.type}
                  type="button"
                  onClick={() => handleFacilityToggle(facility.type)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {getFacilityIcon(facility.icon)}
                  <span>{facility.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <Search className="w-4 h-4" />
          查找空闲会议室
        </button>
      </form>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {hasSearched && (
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              找到 {results.length} 个可用会议室
            </span>
            {results.length > 0 && (
              <span className="text-xs text-purple-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                智能推荐排序
              </span>
            )}
          </div>
        )}

        {hasSearched && results.length === 0 && adjacentSuggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">暂无可用会议室</p>
            <p className="text-xs text-slate-400">
              请尝试调整时间或减少参会人数
            </p>
          </div>
        )}

        {hasSearched && results.length === 0 && adjacentSuggestions.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ClockIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800">当前时段无可用会议室</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  为你找到 {adjacentSuggestions.length} 个相邻时段的选择
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {results.map((rec) => (
            <button
              key={rec.room.id}
              onClick={() => handleRoomSelect(rec.room)}
              className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-purple-50 hover:border-purple-200 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: rec.room.color }}
                    ></div>
                    <p className="font-semibold text-slate-800 text-sm">{rec.room.name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {rec.room.capacity}人
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {rec.room.location}
                    </span>
                  </div>
                  {rec.room.facilities && rec.room.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {rec.room.facilities.map((facilityType) => {
                        const facility = FACILITY_LIST.find((f) => f.type === facilityType);
                        if (!facility) return null;
                        return (
                          <span
                            key={facilityType}
                            className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-0.5"
                          >
                            {getFacilityIcon(facility.icon)}
                            {facility.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium inline-flex items-center gap-1 ${getMatchBadgeColor(rec.capacityMatchLevel)}`}>
                    {rec.capacityMatchLevel === 'perfect' && <CheckCircle className="w-3 h-3" />}
                    {rec.capacityMatchText}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    空闲
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 flex-shrink-0" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {hasSearched && adjacentSuggestions.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-slate-700">相邻时段建议</span>
            </div>
            <div className="space-y-2">
              {adjacentSuggestions.slice(0, 6).map((suggestion, index) => (
                <button
                  key={`${suggestion.room.id}-${suggestion.direction}-${index}`}
                  onClick={() => handleAdjacentSelect(suggestion)}
                  className="w-full text-left p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 hover:border-amber-200 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: suggestion.room.color }}
                        ></div>
                        <p className="font-semibold text-slate-800 text-sm">{suggestion.room.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Clock className="w-3 h-3" />
                          {suggestion.startTime} - {suggestion.endTime}
                        </span>
                        <span className="text-amber-500">
                          {suggestion.direction === 'earlier' ? '提前' : '延后'}{suggestion.timeDiffMinutes}分钟
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {suggestion.room.capacity}人
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getMatchBadgeColor(suggestion.capacityMatchLevel)}`}>
                          {suggestion.capacityMatchText}
                        </span>
                      </div>
                      {suggestion.room.facilities && suggestion.room.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {suggestion.room.facilities.map((facilityType) => {
                            const facility = FACILITY_LIST.find((f) => f.type === facilityType);
                            if (!facility) return null;
                            return (
                              <span
                                key={facilityType}
                                className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-0.5"
                              >
                                {getFacilityIcon(facility.icon)}
                                {facility.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <DoorOpen className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">快速查找</p>
            <p className="text-xs text-slate-400">
              输入条件找到最合适的会议室
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
