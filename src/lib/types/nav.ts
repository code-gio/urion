import { type Icon as IconType } from '@tabler/icons-svelte';

export interface NavItem {
	title: string;
	url?: string;
	disabled?: boolean;
	external?: boolean;
	icon?: IconType;
	label?: string;
	items?: NavItem[];
	isActive?: boolean;
}

export interface SocialLink {
	title: string;
	url: string;
	icon: keyof SocialIcons;
}

export interface SocialIcons {
	twitter: string;
	github: string;
	facebook: string;
	instagram: string;
	linkedin: string;
	youtube: string;
	tiktok: string;
	snapchat: string;
}

export interface SidebarNav {
	title: string;
	items: NavItem[];
}
