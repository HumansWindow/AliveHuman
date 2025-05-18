/**
 * Date manipulation and formatting utilities
 */

/**
 * Format a date according to the specified format
 * @param date The date to format
 * @param format The format string (defaults to 'YYYY-MM-DD')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number, format: string = 'YYYY-MM-DD'): string {
  const d = date instanceof Date ? date : new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Calculate the difference between two dates
 * @param date1 First date
 * @param date2 Second date (defaults to current date)
 * @param unit Unit of time to return ('days', 'hours', 'minutes', 'seconds')
 * @returns Number representing the time difference in the specified unit
 */
export function getDateDifference(
  date1: Date | string | number,
  date2: Date | string | number = new Date(),
  unit: 'days' | 'hours' | 'minutes' | 'seconds' = 'days'
): number {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  
  switch(unit) {
    case 'days':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'hours':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'minutes':
      return Math.floor(diffMs / (1000 * 60));
    case 'seconds':
      return Math.floor(diffMs / 1000);
    default:
      return diffMs;
  }
}

/**
 * Check if a date is today
 * @param date The date to check
 * @returns Boolean indicating if the date is today
 */
export function isToday(date: Date | string | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

/**
 * Add time to a date
 * @param date The base date
 * @param amount The amount to add
 * @param unit The unit of time to add
 * @returns New date with the added time
 */
export function addTime(
  date: Date | string | number,
  amount: number,
  unit: 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds'
): Date {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  
  switch(unit) {
    case 'years':
      d.setFullYear(d.getFullYear() + amount);
      break;
    case 'months':
      d.setMonth(d.getMonth() + amount);
      break;
    case 'days':
      d.setDate(d.getDate() + amount);
      break;
    case 'hours':
      d.setHours(d.getHours() + amount);
      break;
    case 'minutes':
      d.setMinutes(d.getMinutes() + amount);
      break;
    case 'seconds':
      d.setSeconds(d.getSeconds() + amount);
      break;
  }
  
  return d;
}

/**
 * Get start of a time period (day, week, month, year)
 * @param date The reference date
 * @param unit The unit of time
 * @returns Date representing the start of the specified time period
 */
export function getStartOf(
  date: Date | string | number,
  unit: 'day' | 'week' | 'month' | 'year'
): Date {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  
  switch(unit) {
    case 'day':
      d.setHours(0, 0, 0, 0);
      break;
    case 'week':
      const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      break;
    case 'month':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      break;
    case 'year':
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      break;
  }
  
  return d;
}