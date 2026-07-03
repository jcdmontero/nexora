import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function routeExistsSafe(name: string): boolean {
  try {
    if (!route().has(name)) return false
    route(name)
    return true
  } catch {
    return false
  }
}
