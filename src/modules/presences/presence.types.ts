export type StatutPresence = "present" | "absent" | "retard";

export interface Presence {
  eleveId: string;
  statut: StatutPresence;
  minutesRetard?: number;
}

export interface PresenceCoursPayload {
  coursId: string;
  classe: string;
  date: string; // YYYY-MM-DD
  presences: Presence[];
  createdAt?: any;
}
