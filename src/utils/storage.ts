import { Booking, BookingTemplate } from '../types';
import { STORAGE_KEYS } from '../constants';

export function getBookingsFromStorage(): Booking[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!data) return [];
    const bookings: Booking[] = JSON.parse(data);
    return bookings.map((booking) => ({
      ...booking,
      remarks: booking.remarks ?? '',
    }));
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

export function getTemplatesFromStorage(): BookingTemplate[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!data) return [];
    const templates: BookingTemplate[] = JSON.parse(data);
    return templates.map((template) => ({
      ...template,
      remarks: template.remarks ?? '',
    }));
  } catch (error) {
    console.error('Failed to load templates from storage:', error);
    return [];
  }
}

export function saveTemplatesToStorage(templates: BookingTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (error) {
    console.error('Failed to save templates to storage:', error);
  }
}

export function addTemplateToStorage(template: Omit<BookingTemplate, 'id' | 'createdAt'>): BookingTemplate {
  const templates = getTemplatesFromStorage();
  const newTemplate: BookingTemplate = {
    ...template,
    id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  saveTemplatesToStorage(templates);
  return newTemplate;
}

export function deleteTemplateFromStorage(id: string): void {
  const templates = getTemplatesFromStorage();
  const filtered = templates.filter((t) => t.id !== id);
  saveTemplatesToStorage(filtered);
}
