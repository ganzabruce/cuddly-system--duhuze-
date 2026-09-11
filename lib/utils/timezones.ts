/** Timezone data utilities for the timezone picker. */

export const DEFAULT_TIMEZONE_ID = "Africa/Kigali";

export interface TimezoneEntry {
  /** IANA timezone ID, e.g. "Africa/Kigali" */
  id: string;
  /** Friendly display name, e.g. "Central Africa Time - Kigali" */
  label: string;
  /** GMT offset string, e.g. "GMT+02:00" */
  offset: string;
  /** Offset in minutes for sorting */
  offsetMinutes: number;
}

function getCity(id: string): string {
  const parts = id.split("/");
  const city = parts[parts.length - 1];
  return city.replace(/_/g, " ");
}

function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const h = String(Math.floor(abs / 60)).padStart(2, "0");
  const m = String(abs % 60).padStart(2, "0");
  return `GMT${sign}${h}:${m}`;
}

function getTimezoneName(id: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: id,
      timeZoneName: "long",
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value ?? id;
  } catch {
    return id;
  }
}

function getOffsetMinutes(id: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: id,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    const val = tzPart?.value ?? "";
    if (val === "GMT" || val === "UTC") return 0;
    const match = val.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const mins = match[3] ? parseInt(match[3], 10) : 0;
    return sign * (hours * 60 + mins);
  } catch {
    return 0;
  }
}

let _cache: TimezoneEntry[] | null = null;

export function getAllTimezones(): TimezoneEntry[] {
  if (_cache) return _cache;

  const ids: string[] = Intl.supportedValuesOf
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC", "America/New_York", "Europe/London", DEFAULT_TIMEZONE_ID];

  const entries: TimezoneEntry[] = ids.map((id) => {
    const offsetMinutes = getOffsetMinutes(id);
    const name = getTimezoneName(id);
    const city = getCity(id);
    const label = `${name} - ${city}`;
    return {
      id,
      label,
      offset: formatOffset(offsetMinutes),
      offsetMinutes,
    };
  });

  entries.sort((a, b) => a.offsetMinutes - b.offsetMinutes);
  _cache = entries;
  return entries;
}
