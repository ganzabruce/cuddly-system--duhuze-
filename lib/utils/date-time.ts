/** Date/time helpers for calendar and date-time-picker. */

export type Meridiem = "AM" | "PM";

export interface ParsedTime12Input {
  hour12: number;
  minute: string;
  period?: Meridiem;
}

/** Date to YYYY-MM-DD for input[type="date"] */
export function toDateInputValue(date: Date | undefined): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Ensure end time is after start time; if not, return start + 1 hour */
export function adjustEndTime(startTime: string, endTime: string): string {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  if (endTotalMinutes <= startTotalMinutes) {
    const newTotalMinutes = startTotalMinutes + 60;
    const newHours = Math.floor(newTotalMinutes / 60) % 24;
    const newMinutes = newTotalMinutes % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
  }
  return endTime;
}

/** Parse tolerant 12-hour input like 10, 10:00, 3pm, 5:45 pm, 12AM. */
export function parseFlexibleTime12Input(value: string): ParsedTime12Input | null {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  if (!normalized) return null;

  const match = normalized.match(/^(\d{1,2})(?::(\d{1,2}))?([AP]M)?$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = match[2] == null ? 0 : Number(match[2]);
  const period = match[3] as Meridiem | undefined;

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

  return {
    hour12: hour,
    minute: String(minute).padStart(2, "0"),
    period,
  };
}
