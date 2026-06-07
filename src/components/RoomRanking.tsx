import { useMemo } from 'react';
import { BarChart3, Clock, Calendar, TrendingUp } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { getRoomWeekStats, formatDurationMinutes } from '../utils/roomStatsUtils';
import { cn } from '../lib/utils';

interface RoomRankingProps {
  embedded?: boolean;
}

export function RoomRanking({ embedded = false }: RoomRankingProps) {
  const { bookings, currentDate, selectedRoomId, setSelectedRoomId, rooms } = useBookingStore();

  const roomStats = useMemo(() => {
    return getRoomWeekStats(bookings, rooms, currentDate);
  }, [bookings, currentDate, rooms]);

  const maxBookingCount = Math.max(...roomStats.map((r) => r.bookingCount), 1);
  const maxTotalDuration = Math.max(...roomStats.map((r) => r.totalDurationMinutes), 1);

  const handleRoomClick = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full',
        embedded
          ? 'w-full p-4'
          : 'w-full min-w-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-3 md:p-4'
      )}
    >
      <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
        <div className="w-1 h-4 md:h-5 bg-purple-500 rounded-full"></div>
        会议室使用排行
      </h2>

      <div className="space-y-2 md:space-y-3 flex-1 overflow-y-auto">
        {roomStats.map((room, index) => {
          const isSelected = selectedRoomId === room.roomId;
          const countBarWidth = (room.bookingCount / maxBookingCount) * 100;
          const durationBarWidth = (room.totalDurationMinutes / maxTotalDuration) * 100;

          return (
            <button
              key={room.roomId}
              onClick={() => handleRoomClick(room.roomId)}
              className={cn(
                'w-full p-2.5 md:p-3 rounded-xl text-left transition-all duration-200 border-2',
                isSelected
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-transparent bg-slate-50 hover:bg-slate-100'
              )}
            >
              <div className="flex items-center gap-1.5 md:gap-2 mb-2">
                <div className="flex items-center justify-center w-5 h-5">
                  {index < 3 ? (
                    <span
                      className={cn(
                        'text-xs font-bold',
                        index === 0 && 'text-amber-500',
                        index === 1 && 'text-slate-400',
                        index === 2 && 'text-amber-700'
                      )}
                    >
                      {index + 1}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">{index + 1}</span>
                  )}
                </div>
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: room.color }}
                ></div>
                <h3 className="font-semibold text-slate-800 text-sm flex-1 truncate">
                  {room.roomName}
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {room.bookingCount} 次
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${countBarWidth}%`,
                        backgroundColor: room.color,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {formatDurationMinutes(room.totalDurationMinutes)}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300 opacity-60"
                      style={{
                        width: `${durationBarWidth}%`,
                        backgroundColor: room.color,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-500">
                    平均 {formatDurationMinutes(room.avgDurationMinutes)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            本周统计
          </span>
          <span>共 {roomStats.length} 个会议室</span>
        </div>
      </div>
    </div>
  );
}
