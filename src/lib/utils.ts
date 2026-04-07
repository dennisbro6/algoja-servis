import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { sl } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd. M. yyyy', { locale: sl })
  } catch {
    return dateStr
  }
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function nalogStatusLabel(status: string): string {
  return status === 'zakljucen' ? 'Zaključen' : 'Odprt'
}

export function nalogStatusColor(status: string): string {
  return status === 'zakljucen'
    ? 'bg-green-100 text-green-800'
    : 'bg-yellow-100 text-yellow-800'
}
