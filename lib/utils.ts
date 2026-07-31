import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Home path for a given role. Used after login + on `/`. */
export function homeForRole(role: string | null | undefined): string {
  switch (role) {
    case "org_admin":
      return "/admin";
    case "technician":
    case "manager":
      return "/technician/jobs";
    case "requester":
      return "/client/tickets";
    default:
      return "/login";
  }
}
