export interface PlanDefinition {
  id: "free" | "starter" | "pro" | "enterprise";
  name: string;
  price: number;
  maxEleves: number;
  features: string[];
  stripePriceId?: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Gratuit",
    price: 0,
    maxEleves: 50,
    features: [
      "Gestion des eleves",
      "Presences & cahier de texte",
      "Paiements basiques",
      "1 administrateur",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    maxEleves: 200,
    features: [
      "Tout le plan Gratuit",
      "Evaluations & bulletins",
      "Emploi du temps",
      "Notifications",
      "Export Excel",
      "3 administrateurs",
    ],
    stripePriceId: "price_starter",
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    maxEleves: 1000,
    features: [
      "Tout le plan Starter",
      "Analytics avances",
      "Discipline & audit",
      "Comptabilite",
      "Import CSV",
      "Admissions en ligne",
      "Administrateurs illimites",
    ],
    stripePriceId: "price_pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    maxEleves: Infinity,
    features: [
      "Tout le plan Pro",
      "Transport scolaire",
      "Bibliotheque",
      "Gestion RH",
      "LMS",
      "Support prioritaire",
      "API access",
    ],
    stripePriceId: "price_enterprise",
  },
];

export function getPlanById(id: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.id === id);
}

export const FEATURE_PLAN_MAP: Record<string, PlanDefinition["id"]> = {
  evaluations: "starter",
  bulletins: "starter",
  emploi: "starter",
  notifications: "starter",
  exports: "starter",
  analytics: "pro",
  discipline: "pro",
  audit: "pro",
  compta: "pro",
  import: "pro",
  admissions: "pro",
  transport: "enterprise",
  library: "enterprise",
  hr: "enterprise",
  lms: "enterprise",
};
