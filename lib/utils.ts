import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Home path for a given role. Used after login + on `/`. */
export function homeForRole(role: string | null | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "technician":
      return "/technician/jobs";
    case "requester":
      return "/client/tickets";
    default:
      return "/login";
  }
}
