import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";

type ReportType = "attendance" | "grades" | "payments" | "comprehensive";

interface ReportParams {
  type: ReportType;
  dateStart?: string;
  dateEnd?: string;
  classe?: string;
  matiere?: string;
}

interface AttendanceReport {
  totalPresences: number;
  totalAbsences: number;
  totalRetards: number;
  tauxPresence: number;
  byClasse: Record<string, { present: number; absent: number; retard: number; taux: number }>;
}

interface GradesReport {
  moyenneGenerale: number;
  tauxReussite: number;
  byMatiere: Record<string, { moyenne: number; min: number; max: number; totalNotes: number; tauxReussite: number }>;
}

interface PaymentsReport {
  totalAttendu: number;
  totalPaye: number;
  tauxRecouvrement: number;
  impayes: number;
}

interface CorrelationData {
  classe: string;
  tauxPresence: number;
  moyenneNotes: number;
}

export const getAnalyticsReport = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 120 })
  .https.onCall(async (data: ReportParams, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed, "Acces reserve aux admins/gestionnaires.");

    requireArgument(!!data.type, "Le type de rapport est requis.");

    try {
      const result: {
        type: ReportType;
        attendance?: AttendanceReport;
        grades?: GradesReport;
        payments?: PaymentsReport;
        correlations?: CorrelationData[];
        trends?: Record<string, unknown>;
      } = { type: data.type };

      // Build attendance report
      if (data.type === "attendance" || data.type === "comprehensive") {
        let presQuery: FirebaseFirestore.Query = db.collection("presences");
        if (data.dateStart) presQuery = presQuery.where("date", ">=", data.dateStart);
        if (data.dateEnd) presQuery = presQuery.where("date", "<=", data.dateEnd);

        const presSnap = await presQuery.get();
        const byClasse: AttendanceReport["byClasse"] = {};
        let totalPresent = 0, totalAbsent = 0, totalRetard = 0;

        for (const doc of presSnap.docs) {
          const p = doc.data();
          if (data.classe && p.classe !== data.classe) continue;

          const classe = p.classe || "Inconnue";
          if (!byClasse[classe]) byClasse[classe] = { present: 0, absent: 0, retard: 0, taux: 0 };

          if (p.statut === "present") { totalPresent++; byClasse[classe].present++; }
          else if (p.statut === "absent") { totalAbsent++; byClasse[classe].absent++; }
          else if (p.statut === "retard") { totalRetard++; byClasse[classe].retard++; }
        }

        // Calculate rates
        for (const c of Object.keys(byClasse)) {
          const total = byClasse[c].present + byClasse[c].absent + byClasse[c].retard;
          byClasse[c].taux = total > 0 ? Math.round((byClasse[c].present / total) * 100) : 0;
        }

        const totalAll = totalPresent + totalAbsent + totalRetard;
        result.attendance = {
          totalPresences: totalPresent,
          totalAbsences: totalAbsent,
          totalRetards: totalRetard,
          tauxPresence: totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0,
          byClasse,
        };
      }

      // Build grades report
      if (data.type === "grades" || data.type === "comprehensive") {
        const notesSnap = await db.collection("notes").get();
        const evaluationsSnap = await db.collection("evaluations").get();
        const evalMap: Record<string, { matiere: string; maxNote: number }> = {};

        for (const doc of evaluationsSnap.docs) {
          const e = doc.data();
          if (data.matiere && e.matiere !== data.matiere) continue;
          evalMap[doc.id] = { matiere: e.matiere, maxNote: e.maxNote || 20 };
        }

        const byMatiere: GradesReport["byMatiere"] = {};
        let totalNotes = 0, totalSum = 0, passing = 0;

        for (const doc of notesSnap.docs) {
          const n = doc.data();
          const evalInfo = evalMap[n.evaluationId];
          if (!evalInfo) continue;

          const matiere = evalInfo.matiere;
          if (!byMatiere[matiere]) {
            byMatiere[matiere] = { moyenne: 0, min: Infinity, max: -Infinity, totalNotes: 0, tauxReussite: 0 };
          }

          const normalizedNote = (n.note / evalInfo.maxNote) * 20;
          byMatiere[matiere].totalNotes++;
          byMatiere[matiere].min = Math.min(byMatiere[matiere].min, normalizedNote);
          byMatiere[matiere].max = Math.max(byMatiere[matiere].max, normalizedNote);
          byMatiere[matiere].moyenne += normalizedNote;

          totalNotes++;
          totalSum += normalizedNote;
          if (normalizedNote >= 10) {
            passing++;
            byMatiere[matiere].tauxReussite++;
          }
        }

        // Finalize averages
        for (const m of Object.keys(byMatiere)) {
          const info = byMatiere[m];
          if (info.totalNotes > 0) {
            info.tauxReussite = Math.round((info.tauxReussite / info.totalNotes) * 100);
            info.moyenne = Math.round((info.moyenne / info.totalNotes) * 100) / 100;
          }
          if (info.min === Infinity) info.min = 0;
          if (info.max === -Infinity) info.max = 0;
        }

        result.grades = {
          moyenneGenerale: totalNotes > 0 ? Math.round((totalSum / totalNotes) * 100) / 100 : 0,
          tauxReussite: totalNotes > 0 ? Math.round((passing / totalNotes) * 100) : 0,
          byMatiere,
        };
      }

      // Build payments report
      if (data.type === "payments" || data.type === "comprehensive") {
        let payQuery: FirebaseFirestore.Query = db.collection("paiements");
        if (data.dateStart) payQuery = payQuery.where("mois", ">=", data.dateStart.substring(0, 7));
        if (data.dateEnd) payQuery = payQuery.where("mois", "<=", data.dateEnd.substring(0, 7));

        const paySnap = await payQuery.get();
        let totalAttendu = 0, totalPaye = 0, impayes = 0;

        for (const doc of paySnap.docs) {
          const p = doc.data();
          totalAttendu += p.montantTotal || 0;
          totalPaye += p.montantPaye || 0;
          if (p.statut === "impaye") impayes++;
        }

        result.payments = {
          totalAttendu,
          totalPaye,
          tauxRecouvrement: totalAttendu > 0 ? Math.round((totalPaye / totalAttendu) * 100) : 0,
          impayes,
        };
      }

      // Build correlations (comprehensive only)
      if (data.type === "comprehensive") {
        const classesSnap = await db.collection("eleves")
          .where("statut", "==", "actif")
          .get();

        const classeSet = new Set<string>();
        for (const doc of classesSnap.docs) {
          classeSet.add(doc.data().classe);
        }

        const correlations: CorrelationData[] = [];
        for (const classe of classeSet) {
          const attendanceData = result.attendance?.byClasse[classe];
          const tauxPresence = attendanceData?.taux ?? 0;

          // Get average notes for this class
          const notesSnap = await db.collection("notes").get();
          const classEleves = classesSnap.docs
            .filter((d) => d.data().classe === classe)
            .map((d) => d.id);

          let totalNotes = 0, noteSum = 0;
          for (const doc of notesSnap.docs) {
            if (classEleves.includes(doc.data().eleveId)) {
              noteSum += doc.data().note;
              totalNotes++;
            }
          }

          correlations.push({
            classe,
            tauxPresence,
            moyenneNotes: totalNotes > 0 ? Math.round((noteSum / totalNotes) * 100) / 100 : 0,
          });
        }

        result.correlations = correlations;
      }

      return { success: true, report: result };
    } catch (error) {
      handleError(error, "Erreur lors de la generation du rapport.");
    }
  });
