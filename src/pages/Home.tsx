import { useState } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import { Header } from '../components/Header';
import { RoomList } from '../components/RoomList';
import { RoomRanking } from '../components/RoomRanking';
import { CalendarView } from '../components/CalendarView';
import { BookingForm } from '../components/BookingForm';
import { BookingDetailModal } from '../components/BookingDetailModal';
import { TodayOverview } from '../components/TodayOverview';
import { RoomFinder } from '../components/RoomFinder';
import { BatchImportModal } from '../components/BatchImportModal';
import { RoomManagementModal } from '../components/RoomManagementModal';
import { SaveViewModal } from '../components/SaveViewModal';
import { RightPanel } from '../components/RightPanel';
import { LeftDrawer } from '../components/LeftDrawer';
import { RightDrawer } from '../components/RightDrawer';
import { MobileActionBar } from '../components/MobileActionBar';
import { Booking } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Home() {
  const {
    selectedBooking,
    isModalOpen,
    setSelectedBooking,
    setIsModalOpen,
    deleteBooking,
  } = useBookingStore();

  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [rightDrawerDefaultTab, setRightDrawerDefaultTab] = useState<'finder' | 'form'>('form');
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleOpenRightDrawer = (tab: 'finder' | 'form') => {
    setRightDrawerDefaultTab(tab);
    setIsRightDrawerOpen(true);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 p-3 sm:p-4 md:p-6 min-h-0 overflow-hidden w-full pb-20 md:pb-0">
        <div className="h-full w-full flex flex-col gap-3 sm:gap-4 md:gap-5 min-w-0">
          <div className="hidden md:block" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <TodayOverview compact />
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-100"
            >
              <span className="text-sm font-medium text-slate-700">今日总览</span>
              {isOverviewExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {isOverviewExpanded && (
              <div className="mt-2" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <TodayOverview />
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[156px_minmax(0,1fr)_220px] lg:grid-cols-[200px_minmax(0,1fr)_260px] xl:grid-cols-[220px_minmax(0,1fr)_280px] 2xl:grid-cols-[240px_minmax(0,1fr)_300px] gap-3 sm:gap-4 lg:gap-5 min-w-0">
            <div
              className="hidden md:flex h-full flex-col gap-3 md:gap-4 min-h-0 overflow-hidden"
              style={{ animation: 'slideInLeft 0.5s ease-out' }}
            >
              <div className="flex-shrink-0">
                <RoomList />
              </div>
              <div className="flex-1 min-h-0">
                <RoomRanking />
              </div>
            </div>

            <div
              className="h-full min-h-0 min-w-0 w-full col-span-1 md:col-span-1 overflow-hidden"
              style={{ animation: 'fadeIn 0.6s ease-out' }}
            >
              <CalendarView onBookingClick={handleBookingClick} />
            </div>

            <div
              className="hidden xl:flex h-full flex-col gap-3 md:gap-4 min-h-0 overflow-hidden"
              style={{ animation: 'slideInRight 0.5s ease-out' }}
            >
              <div className="flex-shrink-0">
                <RoomFinder />
              </div>
              <div className="flex-1 min-h-0">
                <BookingForm />
              </div>
            </div>

            <div
              className="hidden md:block xl:hidden h-full min-h-0 overflow-hidden"
              style={{ animation: 'slideInRight 0.5s ease-out' }}
            >
              <RightPanel defaultTab="form" />
            </div>
          </div>
        </div>
      </main>

      <div className="md:hidden">
        <MobileActionBar
          onOpenLeftDrawer={() => setIsLeftDrawerOpen(true)}
          onOpenRightDrawer={handleOpenRightDrawer}
        />
      </div>

      <LeftDrawer
        isOpen={isLeftDrawerOpen}
        onClose={() => setIsLeftDrawerOpen(false)}
      />

      <RightDrawer
        isOpen={isRightDrawerOpen}
        onClose={() => setIsRightDrawerOpen(false)}
        defaultTab={rightDrawerDefaultTab}
      />

      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDelete={deleteBooking}
      />

      <BatchImportModal />
      <RoomManagementModal />
      <SaveViewModal />
    </div>
  );
}
