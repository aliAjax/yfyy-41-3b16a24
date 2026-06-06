import { Users, MapPin, Projector, Video, Square, Phone } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { getBookingsForDate } from '../utils/dateUtils';
import { isToday } from 'date-fns';
import { FACILITY_LIST } from '../constants';

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

export function RoomList() {
  const { selectedRoomId, setSelectedRoomId, bookings, currentDate, getActiveRooms } = useBookingStore();
  const activeRooms = getActiveRooms();

  const getRoomStatus = (roomId: string) => {
    if (!isToday(currentDate)) return 'unknown';
    
    const todayBookings = getBookingsForDate(bookings, new Date(), roomId);
    const now = new Date();
    
    const hasActiveMeeting = todayBookings.some((b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return now >= start && now < end;
    });

    if (hasActiveMeeting) return 'busy';
    return 'free';
  };

  return (
    <div className="w-64 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
        会议室列表
      </h2>
      
      <div className="space-y-3 flex-1 overflow-y-auto">
        {activeRooms.map((room) => {
          const status = getRoomStatus(room.id);
          const isSelected = selectedRoomId === room.id;
          
          return (
            <button
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className={`w-full p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-transparent bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: room.color }}
                  ></div>
                  <h3 className="font-semibold text-slate-800">{room.name}</h3>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    status === 'busy'
                      ? 'bg-red-100 text-red-600'
                      : status === 'free'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {status === 'busy' ? '使用中' : status === 'free' ? '空闲' : '—'}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{room.capacity}人</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{room.location}</span>
                </div>
              </div>
              
              {room.facilities && room.facilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {room.facilities.map((facilityType) => {
                    const facility = FACILITY_LIST.find((f) => f.type === facilityType);
                    if (!facility) return null;
                    return (
                      <span
                        key={facilityType}
                        className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-0.5"
                      >
                        {getFacilityIcon(facility.icon)}
                        <span className="hidden sm:inline">{facility.label}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          共 {activeRooms.length} 个会议室
        </p>
      </div>
    </div>
  );
}
