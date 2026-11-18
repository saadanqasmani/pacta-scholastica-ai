/**
 * Academic-year helpers. The academic year rolls over on 1 September
 * (the Turkish and European norm), so November 2026 is in "2026-2027".
 * Every screen that needs "this year" asks here instead of hardcoding one.
 */

/** First calendar year of the academic year containing `date`. */
export function academicYearStart(date: Date = new Date()): number {
  return date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
}

/** Label for the academic year starting in `start`, e.g. 2026 → "2026-2027". */
export function academicYearLabel(start: number): string {
  return `${start}-${start + 1}`;
}

/** The current academic year label. */
export function currentAcademicYear(date: Date = new Date()): string {
  return academicYearLabel(academicYearStart(date));
}

/** The most recent `count` academic years, newest first. */
export function recentAcademicYears(count: number, date: Date = new Date()): string[] {
  const start = academicYearStart(date);
  return Array.from({ length: count }, (_, i) => academicYearLabel(start - i));
}
