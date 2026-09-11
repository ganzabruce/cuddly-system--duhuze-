import { useId } from "react";

export function HeroPattern() {
  const id = useId();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full text-foreground/10"
        viewBox="0 0 1440 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id={`${id}-dots`} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.25" fill="currentColor" fillOpacity="0.7" />
          </pattern>
          <pattern id={`${id}-grid`} width="160" height="160" patternUnits="userSpaceOnUse">
            <path
              d="M0 0H160M0 0V160"
              stroke="currentColor"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill={`url(#${id}-dots)`} />
        <rect width="100%" height="100%" fill={`url(#${id}-grid)`} />

      </svg>
    </div>
  );
}
