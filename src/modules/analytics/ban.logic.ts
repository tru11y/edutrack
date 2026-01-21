export function doitBannirEleve({
  moisActuel,
  paiementMois,
  jour,
}: {
  moisActuel: string;
  paiementMois: { mois: string } | null;
  jour: number;
}): boolean {
  if (jour < 10) return false;
  if (!paiementMois) return true;
  if (paiementMois.mois !== moisActuel) return true;
  return false;
}
