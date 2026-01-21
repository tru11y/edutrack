export function estFacturable(
  statut: "present" | "absent" | "retard",
  minutesRetard: number
): boolean {
  if (statut === "absent") return false;
  if (statut === "retard" && minutesRetard > 15) return false;
  return true;
}
