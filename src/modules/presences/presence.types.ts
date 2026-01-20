// presence.types.ts
export type StatutMetier =
  | "essai"
  | "autorise"
  | "a_renvoyer"
  | "banni";

export interface PresenceItem {
  eleveId: string;
  statut: "present" | "absent" | "retard";
  minutesRetard?: number;

  facturable: boolean;
  statutMetier: StatutMetier;
  message: string;
}

export interface PresenceCoursPayload {
  coursId: string;
  classe: string;
  date: string;
  presences: PresenceItem[];
}
