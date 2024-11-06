import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateString: string) => {
  let date = new Date(dateString);

  if (isNaN(date.getTime())) {
    date = new Date(parseInt(dateString));
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
