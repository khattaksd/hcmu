import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Cache-Control header for the static dataset (changes ~yearly). */
export const STATIC_DATA_CACHE = {
  "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400",
} as const;
