import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Safely merges Tailwind CSS classes, resolving conflicts automatically.
 * Used extensively for porting Aceternity UI components to Angular.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
