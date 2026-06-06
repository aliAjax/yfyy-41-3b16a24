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
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { MeetingRoom } from '../types';
import { format } from 'date-fns';
import { BUSINESS_START_HOUR, BUSINESS_END_HOUR } from '../constants';

export function RoomFinder() {
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
  });

  const [results, setResults] = useState<MeetingRoom[]>([]);
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

    const availableRooms = findAvailableRooms(
      formData.date,
      formData.startTime,
      formData.endTime,
      formData.attendees
    );

    setResults(availableRooms);
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

  return (
    <div className="w-80 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden max-h-[45vh]">
      <div className="p-6 pb-4">
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
          </div>
        )}

        {hasSearched && results.length === 0 && (
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

        <div className="space-y-2">
          {results.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomSelect(room)}
              className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-purple-50 hover:border-purple-200 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: room.color }}
                    ></div>
                    <p className="font-semibold text-slate-800 text-sm">{room.name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {room.capacity}人
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {room.location}
                    </span>
                  </div>
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
