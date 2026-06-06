import { useMemo, useEffect, useState } from 'react';
import {
  CalendarCheck,
  Clock,
  Users,
  DoorOpen,
  ChevronRight,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { Booking } from '../types';
import { getTodayOverviewData, formatMeetingDuration, getTimeUntilMeeting } from '../utils/overviewUtils';
import { formatTime, formatDate } from '../utils/dateUtils';
import { cn } from '../lib/utils';
import { isSameDay } from 'date-fns';

export function TodayOverview() {
  const { bookings, currentDate, setSelectedBooking, setIsModalOpen, setSelectedRoomId, setCurrentDate, getActiveRooms, getRoomById } = useBookingStore();
  const activeRooms = getActiveRooms();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const overviewData = useMemo(() => {
    return getTodayOverviewData(bookings, activeRooms, currentDate, now);
  }, [bookings, currentDate, now, activeRooms]);

  const isToday = isSameDay(currentDate, new Date());

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleRoomClick = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
  };

  const nextMeeting = overviewData.upcomingMeetings[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
          {isToday ? '今日总览' : `${formatDate(currentDate, 'MM月dd日')} 总览`}
        </h2>
        {!isToday && (
          <button
            onClick={handleJumpToToday}
            className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
          >
            回到今天
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">今日预定</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{overviewData.totalBookings}</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-red-600" />
            <span className="text-xs text-red-600 font-medium">进行中</span>
          </div>
          <p className="text-2xl font-bold text-red-700">
            {isToday ? overviewData.activeMeetings.length : '-'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <DoorOpen className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">空闲会议室</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {isToday ? overviewData.freeRoomCount : '-'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-amber-600 font-medium">会议室总数</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{activeRooms.length}</p>
        </div>
      </div>

      {isToday && overviewData.activeMeetings.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            当前会议
          </h3>
          <div className="space-y-2">
            {overviewData.activeMeetings.slice(0, 2).map((booking) => {
              const room = getRoomById(booking.roomId);
              return (
                <button
                  key={booking.id}
                  onClick={() => handleBookingClick(booking)}
                  className="w-full text-left p-3 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: room?.color }}
                        ></div>
                        <p className="font-medium text-slate-800 text-sm truncate">{booking.title}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {room?.name}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0 ml-2" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {nextMeeting && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            下一场会议
          </h3>
          <button
            onClick={() => handleBookingClick(nextMeeting)}
            className="w-full text-left p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm mb-1">{nextMeeting.title}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(nextMeeting.startTime)} - {formatTime(nextMeeting.endTime)}
                  </span>
                  <span className="text-amber-600 font-medium">
                    {isToday ? getTimeUntilMeeting(nextMeeting.startTime, now) : formatMeetingDuration(nextMeeting.startTime, nextMeeting.endTime)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0 ml-2" />
            </div>
          </button>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">会议室状态</h3>
        <div className="space-y-2">
          {overviewData.roomStatuses.map((roomStatus) => {
            const room = getRoomById(roomStatus.roomId);
            return (
              <button
                key={roomStatus.roomId}
                onClick={() => handleRoomClick(roomStatus.roomId)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: room?.color }}
                  ></div>
                  <span className="text-sm font-medium text-slate-700">{roomStatus.roomName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{roomStatus.todayBookingCount} 场会议</span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      roomStatus.status === 'busy'
                        ? 'bg-red-100 text-red-600'
                        : roomStatus.status === 'free'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-slate-200 text-slate-500'
                    )}
                  >
                    {roomStatus.status === 'busy' ? '使用中' : roomStatus.status === 'free' ? '空闲' : '—'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
