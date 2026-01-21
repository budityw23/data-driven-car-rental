import { differenceInCalendarDays, format, parseISO } from 'date-fns';

export const dateUtils = {
  formatDate: (dateString: string): string => {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  },
  
  // Calculate days between two dates (inclusive or exclusive depending on business logic)
  // Standard car rental usually counts 24h cycles or calendar days. 
  // Here we'll do calendar days diff. Min 1 day.
  calculateDays: (start: string, end: string): number => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const days = differenceInCalendarDays(endDate, startDate);
    return Math.max(1, days);
  },

  toISODate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  }
};
