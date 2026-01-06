import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };


export function getInitials(name: string | null | undefined): string {
	if (!name) return "";
	const nameParts = name.trim().split(" ");
	if (nameParts.length === 1) {
	  const word = nameParts[0];
	  if (word.length >= 2) {
		return word.substring(0, 2).toUpperCase();
	  }
	  return (word.charAt(0) + word.charAt(0)).toUpperCase();
	}
	const firstInitial = nameParts[0].charAt(0).toUpperCase();
	const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
	return firstInitial + lastInitial;
  }
  
  export function timeAgo(date: Date): string {
	const now = new Date().getTime();
	const past = date.getTime();
	const seconds = Math.floor((now - past) / 1000);
  
	let interval = Math.floor(seconds / 31536000);
  
	if (interval >= 1) {
	  return interval === 1 ? "1 year ago" : `${interval} years ago`;
	}
	interval = Math.floor(seconds / 2592000);
	if (interval >= 1) {
	  return interval === 1 ? "1 month ago" : `${interval} months ago`;
	}
	interval = Math.floor(seconds / 86400);
	if (interval >= 1) {
	  return interval === 1 ? "1 day ago" : `${interval} days ago`;
	}
	interval = Math.floor(seconds / 3600);
	if (interval >= 1) {
	  return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
	}
	interval = Math.floor(seconds / 60);
	if (interval >= 1) {
	  return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
	}
	return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;
  }
  
  export function timeAgoShort(date: Date): string {
	const now = new Date().getTime();
	const past = date.getTime();
	const seconds = Math.floor((now - past) / 1000);
  
	let interval = Math.floor(seconds / 31536000);
  
	if (interval >= 1) {
	  return interval === 1 ? "1y" : `${interval}y`;
	}
	interval = Math.floor(seconds / 2592000);
	if (interval >= 1) {
	  return interval === 1 ? "1mo" : `${interval}mo`;
	}
	interval = Math.floor(seconds / 86400);
	if (interval >= 1) {
	  return interval === 1 ? "1d" : `${interval}d`;
	}
	interval = Math.floor(seconds / 3600);
	if (interval >= 1) {
	  return interval === 1 ? "1h" : `${interval}h`;
	}
	interval = Math.floor(seconds / 60);
	if (interval >= 1) {
	  return interval === 1 ? "1m" : `${interval}m`;
	}
	return seconds === 1 ? "1s" : `${seconds}s`;
  }
  
  export function toCamelCase(str: string) {
	return str.replace(/([-_][a-z])/gi, (match) =>
	  match.toUpperCase().replace("-", "").replace("_", "")
	);
  }
  