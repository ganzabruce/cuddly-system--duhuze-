import type { ImageFormat } from "@/types/events";

export const EVENT_CATEGORIES = [
    { value: "music", label: "Music" },
    { value: "arts", label: "Arts & Culture" },
    { value: "food", label: "Food & Drinks" },
    { value: "sports", label: "Sports & Wellness" },
    { value: "nightlife", label: "Nightlife" },
    { value: "community", label: "Community" },
    { value: "tech", label: "Tech" },
    { value: "outdoors", label: "Outdoors" },
    { value: "family", label: "Family" },
    { value: "business", label: "Business" },
    { value: "other", label: "Other" },
] as const;

export const EVENT_CATEGORY_VALUES = EVENT_CATEGORIES.map(
    (category) => category.value,
) as [string, ...string[]];

export const EVENT_CATEGORY_LABELS = EVENT_CATEGORIES.reduce(
    (acc, category) => {
        acc[category.value] = category.label;
        return acc;
    },
    {} as Record<string, string>,
);

export const IMAGE_FORMATS = {
    square:    { label: "Square",    ratio: "1/1",  fit: "cover" as const },
    portrait:  { label: "Portrait",  ratio: "4/5",  fit: "cover" as const },
    tall:      { label: "Tall",      ratio: "4/5",  fit: "contain" as const },
    landscape: { label: "Landscape", ratio: "1/1",  fit: "contain" as const },
} as const;


export const THUMBNAIL_RATIO = "1/1";
export const THUMBNAIL_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

export function detectImageFormat(width: number, height: number): ImageFormat {
    if (!width || !height) return "square";
    const r = width / height;
    if (r >= 1.15) return "landscape";
    if (r >= 0.9) return "square";
    if (r >= 0.66) return "portrait";
    return "tall";
}
