import type { NavItem, SocialLink } from "$lib/types/nav";
import {
  IconDashboard,
  IconBuilding,
  IconUsers,
  IconUser,
  IconChartBar,
  IconAdjustments,
  IconFileText,
  IconShield,
  IconSend,
  IconLifebuoy,
  IconClock,
} from "@tabler/icons-svelte";

/* ----------------------------------
   Roles (App-level, not workspace roles)
----------------------------------- */
export type AppRole = "user" | "admin";

/* ----------------------------------
   Site Configuration
----------------------------------- */
export const siteConfig = {
  title: "Urion",
  description: "Workspace-based tools for teams, clients, and internal operations",
  logo: "/logo.svg",
  logoDark: "/logo-dark.svg",
  favicon: "/favicon.png",
};

/* ----------------------------------
   Social Links
----------------------------------- */
export const socialLinks: SocialLink[] = [
  { title: "X", url: "https://x.com/urionai", icon: "x" },
  { title: "LinkedIn", url: "https://linkedin.com/company/urionai", icon: "linkedin" },
];

/* ----------------------------------
   APP ROOT NAV
   Base template for app root navigation (portal route at /)
   URLs are already absolute and do not require resolution
----------------------------------- */
export const navAppRoot: NavItem[] = [
  {
    title: "Workspaces",
    url: "/",
    icon: IconBuilding,
  },
];

/* ----------------------------------
   WORKSPACE NAV
   Base template for workspace navigation
   Used inside /w/:workspaceSlug/*
   URLs are relative and require resolution via resolveWorkspaceNav()
----------------------------------- */
export const navWorkspace: NavItem[] = [
  {
    title: "Dashboard",
    url: "", // resolved dynamically to /w/:workspaceSlug
    icon: IconDashboard,
  },
  {
    title: "Projects",
    url: "projects",
    icon: IconBuilding,
  },
  {
    title: "Files",
    url: "files",
    icon: IconFileText,
  },
  {
    title: "Analytics",
    url: "analytics",
    icon: IconChartBar,
  },
  {
    title: "Team",
    url: "team",
    icon: IconUsers,
  },
  {
    title: "Settings",
    url: "settings",
    icon: IconAdjustments,
    items: [
      { title: "General", url: "settings/general" },
      { title: "Billing", url: "settings/billing" },
      { title: "Integrations", url: "settings/integrations" },
    ],
  },
];

/* ----------------------------------
   PROJECT NAV
   Base template for project navigation
   Used inside /w/:workspaceSlug/p/:projectSlug/*
   URLs are relative and require resolution via resolveProjectNav()
----------------------------------- */
export const navProject: NavItem[] = [
  {
    title: "Overview",
    url: "", // resolved dynamically to /w/:workspaceSlug/p/:projectSlug
    icon: IconDashboard,
  },
  {
    title: "Tools",
    url: "tools",
    icon: IconChartBar,
  },
  {
    title: "Files",
    url: "files",
    icon: IconFileText,
  },
  {
    title: "Activity",
    url: "activity",
    icon: IconClock,
  },
  {
    title: "Settings",
    url: "settings",
    icon: IconAdjustments,
  },
];

/* ----------------------------------
   ADMIN NAV (Platform-level)
----------------------------------- */
export const navAdmin: NavItem[] = [
  {
    title: "Admin Dashboard",
    url: "/admin",
    icon: IconDashboard,
  },
  {
    title: "Workspaces",
    url: "/admin/workspaces",
    icon: IconBuilding,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: IconUsers,
  },
  {
    title: "Security",
    url: "/admin/security",
    icon: IconShield,
  },
];

/* ----------------------------------
   Secondary Navigation
----------------------------------- */
export const navSecondary: NavItem[] = [
  { title: "Documentation", url: "https://docs.urion.ai", icon: IconFileText },
  { title: "Support", url: "https://support.urion.ai", icon: IconLifebuoy },
  { title: "Feedback", url: "/feedback", icon: IconSend },
];

/* ----------------------------------
   Footer Configuration
----------------------------------- */
export const footerConfig = {
  sections: {
    company: {
      title: "Company",
      links: [
        { title: "About urion.ai", url: "/about" },
        { title: "Contact", url: "/contact" },
      ],
    },
    help: {
      title: "Help",
      links: [
        { title: "Documentation", url: "https://docs.urion.ai" },
        { title: "Security", url: "/security" },
        { title: "Status", url: "/status" },
      ],
    },
  },
  legal: [
    { title: "Terms of Service", url: "/terms" },
    { title: "Privacy Policy", url: "/privacy" },
  ],
};

/* ----------------------------------
   USER NAV
   Base template for user account navigation
   URLs are already absolute and do not require resolution
----------------------------------- */
export const userNav: NavItem[] = [
  { title: "Profile", icon: IconUser, url: "/account" },
  { title: "Security", icon: IconShield, url: "/account/security" },
];

/* ----------------------------------
   NAVIGATION RESOLVERS
   Functions to resolve navigation items with proper URLs based on context
----------------------------------- */

/**
 * Resolves workspace navigation items with workspace slug prefix.
 * Transforms relative URLs to absolute paths like /w/:workspaceSlug/*
 *
 * @param workspaceSlug - The workspace slug to use in resolved URLs
 * @returns Array of resolved NavItem objects with absolute URLs
 *
 * @example
 * ```typescript
 * const resolved = resolveWorkspaceNav("acme-corp");
 * // Returns nav items with URLs like "/w/acme-corp", "/w/acme-corp/projects", etc.
 * ```
 */
export function resolveWorkspaceNav(workspaceSlug: string): NavItem[] {
  return navWorkspace.map((item) => ({
    ...item,
    url: item.url ? `/w/${workspaceSlug}/${item.url}` : `/w/${workspaceSlug}`,
    items: item.items?.map((subItem) => ({
      ...subItem,
      url: `/w/${workspaceSlug}/${subItem.url}`,
    })),
  }));
}

/**
 * Resolves project navigation items with workspace and project slug prefixes.
 * Transforms relative URLs to absolute paths like /w/:workspaceSlug/p/:projectSlug/*
 *
 * @param workspaceSlug - The workspace slug to use in resolved URLs
 * @param projectSlug - The project slug to use in resolved URLs
 * @returns Array of resolved NavItem objects with absolute URLs
 *
 * @example
 * ```typescript
 * const resolved = resolveProjectNav("acme-corp", "website-redesign");
 * // Returns nav items with URLs like "/w/acme-corp/p/website-redesign", "/w/acme-corp/p/website-redesign/files", etc.
 * ```
 */
export function resolveProjectNav(workspaceSlug: string, projectSlug: string): NavItem[] {
  const basePath = `/w/${workspaceSlug}/p/${projectSlug}`;
  return navProject.map((item) => ({
    ...item,
    url: item.url ? `${basePath}/${item.url}` : basePath,
  }));
}

/**
 * Returns app root navigation items.
 * These nav items already have absolute URLs and do not require resolution.
 *
 * @returns Array of NavItem objects with absolute URLs
 */
export function resolveAppRootNav(): NavItem[] {
  return [...navAppRoot];
}

/**
 * Returns user account navigation items.
 * These nav items already have absolute URLs and do not require resolution.
 *
 * @returns Array of NavItem objects with absolute URLs
 */
export function resolveUserNav(): NavItem[] {
  return [...userNav];
}

/* ----------------------------------
   Navbar Resolver (Role-based)
----------------------------------- */
export function getNavbarForRole(role: AppRole): NavItem[] {
  const baseNav = resolveAppRootNav();

  if (role === "admin") {
    return [...baseNav, ...navAdmin];
  }

  return baseNav;
}
