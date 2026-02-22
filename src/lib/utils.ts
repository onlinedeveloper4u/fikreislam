import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatBytes(bytes: number, units?: { bytes?: string, kb?: string, mb?: string, gb?: string }) {
  if (bytes === 0) return `0 ${units?.bytes || 'Bytes'}`;
  const k = 1024;
  const sizes = [
    units?.bytes || 'Bytes',
    units?.kb || 'KB',
    units?.mb || 'MB',
    units?.gb || 'GB'
  ];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + (sizes[i] || 'MB');
}
