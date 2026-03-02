/**
 * Activity sync stubs for ARK Identity.
 * In Daily DNA, activity syncs to leader dashboards.
 * ARK doesn't need this — these are no-ops to satisfy imports.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function onJournalEntrySaved(_user: unknown): Promise<void> {
  // No-op: ARK doesn't sync journal activity to a leader dashboard
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function onPrayerSessionComplete(_user: unknown, _duration: unknown): Promise<void> {
  // No-op: ARK doesn't sync prayer activity to a leader dashboard
}
