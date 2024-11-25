import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTimeRange = (
  startDate: Date | string, 
  endDate: Date | string,
  shortFormat: boolean = false
) => {
  let start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  let end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(start.getTime())) {
    const numericStart = parseInt(startDate as string);
    if (!isNaN(numericStart)) {
      start = new Date(numericStart);
    }
  }

  if (isNaN(end.getTime())) {
    const numericEnd = parseInt(endDate as string);
    if (!isNaN(numericEnd)) {
      end = new Date(numericEnd);
    }
  }

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      date: 'Invalid date range',
      time: 'Invalid time range'
    };
  }

  const longDateFormat: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  };

  const shortDateFormat: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  };

  const timeFormat: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  const dateFormat = shortFormat ? shortDateFormat : longDateFormat;
  const isSameDay = start.toDateString() === end.toDateString();

  return {
    date: isSameDay 
      ? shortFormat
        ? `${start.toLocaleDateString('en-US', dateFormat)} · ${start.toLocaleTimeString('en-US', timeFormat)}`
        : start.toLocaleDateString('en-US', dateFormat)
      : `${start.toLocaleDateString('en-US', dateFormat)} to ${end.toLocaleDateString('en-US', dateFormat)}`,
    time: !shortFormat ? `${start.toLocaleTimeString('en-US', timeFormat)} to ${end.toLocaleTimeString('en-US', timeFormat)}` : ''
  };
};


export const formatCommentDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date).replace(',', '');
};