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
import { Booking } from '../types';

export default function Home() {
  const {
    selectedBooking,
    isModalOpen,
    setSelectedBooking,
    setIsModalOpen,
    deleteBooking,
  } = useBookingStore();

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 min-h-0 overflow-hidden w-full">
        <div className="h-full w-full flex flex-col gap-6 min-w-0">
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <TodayOverview />
          </div>
          
          <div className="flex-1 min-h-0 grid grid-cols-[256px_1fr_320px] gap-6 min-w-0">
            <div
              className="h-full flex flex-col gap-4 min-h-0"
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
              className="h-full min-w-0 w-full"
              style={{ animation: 'fadeIn 0.6s ease-out' }}
            >
              <CalendarView onBookingClick={handleBookingClick} />
            </div>
            
            <div
              className="h-full flex flex-col gap-4 min-h-0"
              style={{ animation: 'slideInRight 0.5s ease-out' }}
            >
              <div className="flex-shrink-0">
                <RoomFinder />
              </div>
              <div className="flex-1 min-h-0">
                <BookingForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDelete={deleteBooking}
      />

      <BatchImportModal />
    </div>
  );
}
