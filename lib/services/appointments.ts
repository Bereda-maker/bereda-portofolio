export type TimeRange = { startsAt: Date; endsAt: Date };
export type Conflict = TimeRange & { source: 'appointment' | 'blocked_time'; id?: number };
export type ConflictValidation = { ok: true } | { ok: false; conflicts: Conflict[] };

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean { return a.startsAt < b.endsAt && b.startsAt < a.endsAt; }
export function validateAppointmentWindow(range: TimeRange): void {
  if (!(range.startsAt instanceof Date) || !(range.endsAt instanceof Date) || Number.isNaN(range.startsAt.valueOf()) || Number.isNaN(range.endsAt.valueOf())) throw new Error('Appointment times must be valid dates.');
  if (range.startsAt >= range.endsAt) throw new Error('Appointment end must be after its start.');
}
export function validateAppointmentConflicts(requested: TimeRange, existingAppointments: Array<TimeRange & { id?: number; status?: string }>, blockedTimes: Array<TimeRange & { id?: number }>): ConflictValidation {
  validateAppointmentWindow(requested);
  const conflicts: Conflict[] = [
    ...existingAppointments.filter(a => a.status !== 'cancelled' && rangesOverlap(requested, a)).map(a => ({ ...a, source: 'appointment' as const })),
    ...blockedTimes.filter(b => rangesOverlap(requested, b)).map(b => ({ ...b, source: 'blocked_time' as const })),
  ];
  return conflicts.length ? { ok: false, conflicts } : { ok: true };
}
