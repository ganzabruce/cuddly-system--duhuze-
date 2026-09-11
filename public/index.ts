export { InstagramIcon } from "@/components/ui/icons/InstagramIcon";
export { XIcon } from "@/components/ui/icons/XIcon";
export { TikTokIcon } from "@/components/ui/icons/TikTokIcon";
export { FacebookIcon } from "@/components/ui/icons/FacebookIcon";
export { LinkedInIcon } from "@/components/ui/icons/LinkedInIcon";

export const brandIcons = {
  icon: "/logos/icon-512.png",
  iconLight: "/logos/icon-512.png",
  iconDark: "/logos/icon-512-white.png",
  maskedLight: "/logos/icon-512-masked-dark.png",
  maskedDark: "/logos/icon-512-masked-white.png",
} as const;

export const brandLogos = {
  wordmarkLight: "/logos/wordmark-light.svg",
  wordmarkDark: "/logos/wordmark-dark.svg",
} as const;

/**
 * Shared public images.
 *
 * These are plain `/images/...` paths so they can be used anywhere in the app,
 * site, or admin panel without importing the files individually.
 */
export const staticImages = {
  actionMoment: "/images/58.png",
  organizers: "/images/59.png",
  signupCover: "/images/61.png",
  dashboardLight: "/images/app-images/overview-light.png",
  dashboardDark: "/images/app-images/overview-dark.png",
} as const;

/**
 * Theme-aware dashboard screenshots.
 *
 * Usage with `ThemeImage`:
 * ```tsx
 * import { screenshots } from "@/public";
 * import { ThemeImage } from "@/components/ui/theme-image";
 *
 * <ThemeImage
 *   lightSrc={screenshots.overview.light}
 *   darkSrc={screenshots.overview.dark}
 *   alt="Dashboard overview"
 *   width={800}
 *   height={600}
 * />
 * ```
 */
export const screenshots = {
  account: {
    light: "/images/app-images/account-light.png",
    dark: "/images/app-images/account-dark.png",
  },
  analytics: {
    light: "/images/app-images/analytics-light.png",
    dark: "/images/app-images/analytics-dark.png",
  },
  event: {
    light: "/images/app-images/event-light.png",
    dark: "/images/app-images/event-dark.png",
  },
  eventpage: {
    light: "/images/app-images/eventpage-light.png",
    dark: "/images/app-images/eventpage-dark.png",
  },
  guests: {
    light: "/images/app-images/guest-light.png",
    dark: "/images/app-images/guest-dark.png",
  },
  notifications: {
    light: "/images/app-images/notifications-light.png",
    dark: "/images/app-images/notifications-dark.png",
  },
  overview: {
    light: "/images/app-images/overview-light.png",
    dark: "/images/app-images/overview-dark.png",
  },
  settings: {
    light: "/images/app-images/settings-light.png",
    dark: "/images/app-images/settings-dark.png",
  },
} as const;
