import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: Date | null | undefined): string => {
  if (!date) return "N/A"
  return new Date(date).toLocaleString()
}
