import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export interface Recommendation {
  category: "academique" | "financier" | "organisationnel" | "marketing";
  priority: "haute" | "moyenne" | "basse";
  titre: string;
  detail: string;
  action: string;
}

export const getRecommendations = functions
  .region("europe-west1")
  .https.onCall(async (_data, context) => {
    requireAuth(context.auth?.uid);
    const ok = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(ok, "Acces refuse.");
    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const [elevesSnap, profsSnap, classesSnap, paiementsSnap,
             appelsSnap, notesSnap, cahierSnap, emploiSnap] = await Promise.all([
        db.collection("eleves").where("schoolId", "==", schoolId).get(),
        db.collection("professeurs").where("schoolId", "==", schoolId).get(),
        db.collection("classes").where("schoolId", "==", schoolId).get(),
        db.collection("paiements").where("schoolId", "==", schoolId).get(),
        db.collectionGroup("appels").where("schoolId", "==", schoolId).get(),
        db.collection("notes").where("schoolId", "==", schoolId).get(),
        db.collection("cahier").where("schoolId", "==", schoolId).get(),
        db.collection("emploi_du_temps").where("schoolId", "==", schoolId).get(),
      ]);

      const recs: Recommendation[] = [];
      const totalEleves = elevesSnap.size;
      const totalProfs = profsSnap.size;
      const totalClasses = classesSnap.size;

      // ─── FINANCIER ─────────────────────────────────────────────────────────
      let totalDu = 0, totalPaye = 0, impayeCount = 0;
      paiementsSnap.docs.forEach((d) => {
        const p = d.data();
        totalDu += p.montantTotal || 0;
        totalPaye += p.montantPaye || 0;
        if (p.statut === "impaye") impayeCount++;
      });
      const tauxRecouvrement = totalDu > 0 ? (totalPaye / totalDu) * 100 : 100;

      if (tauxRecouvrement < 60) {
        recs.push({
          category: "financier", priority: "haute",
          titre: `Taux de recouvrement critique : ${Math.round(tauxRecouvrement)}%`,
          detail: `${impayeCount} paiement(s) impayé(s) représentant ${Math.round(totalDu - totalPaye).toLocaleString()} FCFA de créances. En dessous de 60%, la trésorerie est en danger.`,
          action: "Envoyer des rappels aux parents concernés via la messagerie et planifier des entretiens.",
        });
      } else if (tauxRecouvrement < 80) {
        recs.push({
          category: "financier", priority: "moyenne",
          titre: `Recouvrement à améliorer : ${Math.round(tauxRecouvrement)}%`,
          detail: `${impayeCount} paiement(s) en attente. L'objectif recommandé est 85% minimum.`,
          action: "Mettre en place un échéancier de paiement pour les familles en difficulté.",
        });
      }

      // ─── ACADEMIQUE ────────────────────────────────────────────────────────
      // Taux de présence global
      let present = 0, absent = 0, retard = 0;
      appelsSnap.docs.forEach((d) => {
        const s = d.data().statut;
        if (s === "present") present++;
        else if (s === "absent") absent++;
        else if (s === "retard") retard++;
      });
      const totalAppels = present + absent + retard;
      const tauxPresence = totalAppels > 0 ? ((present + retard) / totalAppels) * 100 : 100;

      if (tauxPresence < 75) {
        recs.push({
          category: "academique", priority: "haute",
          titre: `Taux de présence alarmant : ${Math.round(tauxPresence)}%`,
          detail: `${absent} absence(s) enregistrée(s). Un taux sous 75% affecte directement les résultats scolaires.`,
          action: "Identifier les élèves à plus de 20% d'absences et contacter immédiatement leurs parents.",
        });
      } else if (tauxPresence < 85) {
        recs.push({
          category: "academique", priority: "moyenne",
          titre: `Taux de présence perfectible : ${Math.round(tauxPresence)}%`,
          detail: `Des absences répétées sont observées. L'objectif recommandé est 90%.`,
          action: "Mettre en place un suivi hebdomadaire des absences par classe.",
        });
      }

      // Moyenne générale des notes
      const noteValues = notesSnap.docs.map((d) => d.data().note).filter((n) => typeof n === "number") as number[];
      if (noteValues.length > 0) {
        const moyenne = noteValues.reduce((a, b) => a + b, 0) / noteValues.length;
        if (moyenne < 10) {
          recs.push({
            category: "academique", priority: "haute",
            titre: `Moyenne générale insuffisante : ${moyenne.toFixed(1)}/20`,
            detail: `La moyenne de l'établissement est sous la barre des 10/20, ce qui est préoccupant.`,
            action: "Analyser les matières les plus faibles et organiser des séances de soutien scolaire.",
          });
        } else if (moyenne < 12) {
          recs.push({
            category: "academique", priority: "moyenne",
            titre: `Niveau académique à renforcer : ${moyenne.toFixed(1)}/20`,
            detail: `La moyenne de l'établissement se situe entre 10 et 12, avec une marge de progression.`,
            action: "Identifier les classes les moins performantes et renforcer l'encadrement pédagogique.",
          });
        }
      }

      // ─── ORGANISATIONNEL ──────────────────────────────────────────────────
      // Ratio élèves/prof
      if (totalProfs > 0 && totalEleves > 0) {
        const ratio = totalEleves / totalProfs;
        if (ratio > 40) {
          recs.push({
            category: "organisationnel", priority: "haute",
            titre: `Ratio élèves/enseignant élevé : ${Math.round(ratio)} élèves par prof`,
            detail: `Un ratio supérieur à 40 nuit à la qualité de l'encadrement. Norme recommandée : 25-30.`,
            action: "Planifier le recrutement de nouveaux enseignants pour la prochaine rentrée.",
          });
        }
      }

      // Emploi du temps insuffisant
      if (totalClasses > 0 && emploiSnap.size < totalClasses * 5) {
        recs.push({
          category: "organisationnel", priority: "moyenne",
          titre: "Emploi du temps incomplet",
          detail: `${emploiSnap.size} créneau(x) pour ${totalClasses} classe(s). Certaines classes manquent de cours planifiés.`,
          action: "Compléter l'emploi du temps pour toutes les classes avant la prochaine semaine.",
        });
      }

      // Cahier de texte sous-utilisé
      const now = new Date();
      const cutoff = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
      const recentCahier = cahierSnap.docs.filter((d) => {
        const ts = d.data().createdAt?.toDate?.();
        return ts && ts > cutoff;
      }).length;
      if (totalProfs > 1 && recentCahier < totalProfs) {
        recs.push({
          category: "organisationnel", priority: "basse",
          titre: "Cahier de texte peu renseigné",
          detail: `Seulement ${recentCahier} entrée(s) sur les 14 derniers jours pour ${totalProfs} enseignant(s).`,
          action: "Rappeler aux enseignants l'obligation de renseigner le cahier de texte chaque semaine.",
        });
      }

      // ─── MARKETING ────────────────────────────────────────────────────────
      if (totalEleves < 50) {
        recs.push({
          category: "marketing", priority: "haute",
          titre: "Effectif à développer",
          detail: `L'établissement accueille ${totalEleves} élève(s). En dessous de 50, la viabilité économique est fragile.`,
          action: "Activer votre page d'inscription en ligne, partager le lien sur les réseaux sociaux et dans les mosquées/églises du quartier.",
        });
      } else if (totalEleves < 150) {
        recs.push({
          category: "marketing", priority: "basse",
          titre: "Potentiel de croissance",
          detail: `Avec ${totalEleves} élèves, il reste une marge de croissance significative.`,
          action: "Proposer des journées portes ouvertes et collecter des témoignages de parents satisfaits à publier en ligne.",
        });
      }

      // Trier par priorité
      const order = { haute: 0, moyenne: 1, basse: 2 };
      recs.sort((a, b) => order[a.priority] - order[b.priority]);

      return { success: true, recommendations: recs };
    } catch (error) {
      handleError(error, "Erreur lors du calcul des recommandations.");
    }
  });
