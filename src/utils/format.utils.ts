/**
 * Format file size in bytes to human-readable format
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "234 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format date as relative time (e.g., "2 hours ago", "3 days ago")
 * @param date Date string or Date object
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const past = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - past.getTime()
  
  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  
  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

/**
 * Format date as absolute date string
 * @param date Date string or Date object
 * @returns Formatted date string (e.g., "Dec 31, 2025")
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  return d.toLocaleDateString('en-US', options)
}

/**
 * Format date with time
 * @param date Date string or Date object
 * @returns Formatted date and time string (e.g., "Dec 31, 2025, 6:30 PM")
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
  
  return d.toLocaleDateString('en-US', options)
}
