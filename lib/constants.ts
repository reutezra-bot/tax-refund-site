// ─── Contact / Support ───────────────────────────────────────────────────────
// Change WHATSAPP_PHONE to update the floating button and all contact links.
// Format: international without '+' (e.g. 972XXXXXXXXX)
export const WHATSAPP_PHONE = '972584308004';

export const WHATSAPP_MESSAGE = 'שלום, אשמח לברר לגבי בדיקת החזר מס';

export function whatsappHref(message = WHATSAPP_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

// ─── Site assets ─────────────────────────────────────────────────────────────
// Public-folder image paths. All Hebrew chars are encoded so next/image is happy.
export const SITE_IMAGES = {
  /** Smiling professional woman at desk — ideal for hero */
  hero: encodeURI('/images/החזר מס לשכירים.jpg'),
  /** Man at laptop — good for steps / how-it-works */
  laptop: encodeURI('/images/החזר מס לשכירים (1).jpg'),
  /** Person with calculator and financial papers — good for trust section */
  calculator: encodeURI('/images/החזר מס לשכירים (2).jpg'),
} as const;

export const LOGO_PATH = '/logo/logo.png';

// ─── Brand ───────────────────────────────────────────────────────────────────
export const BRAND_NAME = 'אסף פרץ — רואה חשבון';
export const BRAND_NAME_EN = 'Assaf Perets CPA';
