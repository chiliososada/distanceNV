import { format, formatDistanceToNow, formatDistance, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format a date string to a readable format
 * @param dateInput ISO date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (dateInput: string | Date): string => {
  // Handle different input types
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }
  
  return format(date, 'MMM d, yyyy');
};

/**
 * Get relative time from now
 * @param dateInput ISO date string or Date object
 * @returns Relative time string
 */
export const getRelativeTime = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Format a date for message timestamps
 * @param dateInput ISO date string or Date object
 * @returns Formatted time string
 */
export const formatMessageTime = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  // If within the last week, show day name
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) {
    return format(date, 'EEEE');
  }
  
  return format(date, 'MMM d');
};

/**
 * Format expiration time
 * @param dateInput ISO date string or Date object
 * @returns Formatted expiration time string
 */
export const formatExpirationTime = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  const now = new Date();
  
  if (date < now) {
    return 'Expired';
  }
  
  return `Expires ${formatDistanceToNow(date, { addSuffix: true })}`;
};

/**
 * Format time ago for topic details
 * @param dateInput ISO date string or Date object
 * @returns Formatted time ago string
 */
export const formatTimeAgo = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  const now = new Date();
  
  return formatDistance(date, now, { addSuffix: true });
};