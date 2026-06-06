import { Booking } from '../types';
import { STORAGE_KEYS } from '../constants';

export function getBookingsFromStorage(): Booking[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load bookings from storage:', error);
    return [];
  }
}

export function saveBookingsToStorage(bookings: Booking[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch (error) {
    console.error('Failed to save bookings to storage:', error);
  }
}
