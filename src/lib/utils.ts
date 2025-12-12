export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

export const formatDateLong = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const formatActionType = (actionType: string): string => {
  return actionType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const calculateUsagePercent = (used: number, total: number): number => {
  if (total === 0) return 0;
  return (used / total) * 100;
};

export const getUsageColor = (
  usagePercent: number
): { text: string; bg: string; badge: 'success' | 'warning' | 'danger' | 'default' } => {
  if (usagePercent >= 95)
    return { text: 'text-red-600', bg: 'bg-red-600', badge: 'danger' };
  if (usagePercent >= 90)
    return { text: 'text-red-500', bg: 'bg-red-500', badge: 'danger' };
  if (usagePercent >= 80)
    return { text: 'text-orange-500', bg: 'bg-orange-500', badge: 'warning' };
  if (usagePercent >= 60)
    return { text: 'text-yellow-600', bg: 'bg-yellow-500', badge: 'warning' };
  return { text: 'text-green-600', bg: 'bg-green-600', badge: 'success' };
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateRandomColor = (): string => {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-red-500 to-red-600',
    'from-orange-500 to-orange-600',
    'from-teal-500 to-teal-600',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const classNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
};

export const getHealthScore = (
  lastLogin: string | null,
  hasRecovery: boolean,
  isSuspended: boolean,
  failedAttempts: number
): { score: number; color: string; label: string } => {
  let score = 100;

  if (!lastLogin) {
    score -= 30;
  } else {
    const daysSinceLogin = Math.floor(
      (new Date().getTime() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLogin > 90) score -= 30;
    else if (daysSinceLogin > 60) score -= 20;
    else if (daysSinceLogin > 30) score -= 10;
  }

  if (!hasRecovery) score -= 20;
  if (isSuspended) score -= 30;
  if (failedAttempts > 0) score -= 10;

  let color = 'green';
  let label = 'Healthy';

  if (score < 40) {
    color = 'red';
    label = 'Critical';
  } else if (score < 60) {
    color = 'orange';
    label = 'Warning';
  } else if (score < 80) {
    color = 'yellow';
    label = 'Fair';
  }

  return { score, color, label };
};

export const sortByDate = <T extends { created_at?: string; timestamp?: string }>(
  items: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
    const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export const downloadCSV = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
