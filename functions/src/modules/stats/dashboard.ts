import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdmin, verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";

export const getAdminDashboardStats = functions
  .region("europe-west1")
  .https.onCall(async (_data: unknown, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent acceder aux statistiques.");

    try {
      const [elevesSnap, profsSnap, classesSnap, paiementsSnap, depensesSnap, salairesSnap] =
        await Promise.all([
          db.collection("eleves").get(),
          db.collection("professeurs").get(),
          db.collection("classes").get(),
          db.collection("paiements").get(),
          db.collection("depenses").get(),
          db.collection("salaires").get(),
        ]);

      let totalPaiementsRecus = 0;
      let totalPaiementsAttendus = 0;

      paiementsSnap.docs.forEach((doc) => {
        const d = doc.data();
        totalPaiementsRecus += d.montantPaye || 0;
        totalPaiementsAttendus += d.montantTotal || 0;
      });

      const tauxCouverture =
        totalPaiementsAttendus > 0
          ? Math.round((totalPaiementsRecus / totalPaiementsAttendus) * 100)
          : 0;

      let totalDepenses = 0;
      depensesSnap.docs.forEach((doc) => {
        totalDepenses += doc.data().montant || 0;
      });

      let totalSalaires = 0;
      salairesSnap.docs.forEach((doc) => {
        const d = doc.data();
        if (d.statut === "paye") {
          totalSalaires += d.montant || 0;
        }
      });

      return {
        success: true,
        stats: {
          totalEleves: elevesSnap.size,
          totalProfesseurs: profsSnap.size,
          totalClasses: classesSnap.size,
          totalPaiementsRecus,
          totalPaiementsAttendus,
          tauxCouverture,
          totalDepenses,
          totalSalaires,
        },
      };
    } catch (error) {
      handleError(error, "Erreur lors du calcul des statistiques.");
    }
  });

// FIX C4: Stats detaillees cote serveur (remplace le fetch all client)
interface EleveStatDetail {
  eleveId: string;
  nom: string;
  prenom: string;
  classe: string;
  sexe: string;
  presences: number;
  absences: number;
  retards: number;
  tauxPresence: number;
  paiementTotal: number;
  paiementPaye: number;
  paiementStatut: "ok" | "partiel" | "impaye";
}

export const getDetailedStats = functions
  .region("europe-west1")
  .https.onCall(async (data: { classe?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAuthorized = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAuthorized, "Acces refuse.");

    try {
      const [elevesSnap, appelsSnap, paiementsSnap] = await Promise.all([
        db.collection("eleves").get(),
        db.collectionGroup("appels").get(),
        db.collection("paiements").get(),
      ]);

      // Build presence map: eleveId -> {present, absent, retard}
      // Uses collectionGroup query to fetch all appels in a single read
      const presenceMap = new Map<string, { present: number; absent: number; retard: number }>();

      appelsSnap.docs.forEach((appel) => {
        const d = appel.data();
        const eleveId = d.eleveId || appel.id;
        const current = presenceMap.get(eleveId) || { present: 0, absent: 0, retard: 0 };

        if (d.statut === "present") current.present++;
        else if (d.statut === "absent") current.absent++;
        else if (d.statut === "retard") current.retard++;

        presenceMap.set(eleveId, current);
      });

      // Build paiement map: eleveId -> {total, paye, hasImpaye, hasPartiel}
      const paiementMap = new Map<string, { total: number; paye: number; hasImpaye: boolean; hasPartiel: boolean }>();

      paiementsSnap.docs.forEach((doc) => {
        const d = doc.data();
        const eleveId = d.eleveId;
        if (!eleveId) return;

        const current = paiementMap.get(eleveId) || { total: 0, paye: 0, hasImpaye: false, hasPartiel: false };
        current.total += d.montantTotal || 0;
        current.paye += d.montantPaye || 0;
        if (d.statut === "impaye") current.hasImpaye = true;
        if (d.statut === "partiel") current.hasPartiel = true;
        paiementMap.set(eleveId, current);
      });

      // Build stats per eleve
      let eleves = elevesSnap.docs;
      if (data?.classe) {
        eleves = eleves.filter((doc) => doc.data().classe === data.classe);
      }

      const statsEleves: EleveStatDetail[] = eleves.map((doc) => {
        const d = doc.data();
        const pres = presenceMap.get(doc.id) || { present: 0, absent: 0, retard: 0 };
        const pai = paiementMap.get(doc.id) || { total: 0, paye: 0, hasImpaye: false, hasPartiel: false };

        const totalPresences = pres.present + pres.absent + pres.retard;
        const tauxPresence = totalPresences > 0
          ? Math.round(((pres.present + pres.retard) / totalPresences) * 100)
          : 0;

        let paiementStatut: "ok" | "partiel" | "impaye" = "ok";
        if (pai.hasImpaye) paiementStatut = "impaye";
        else if (pai.hasPartiel) paiementStatut = "partiel";

        return {
          eleveId: doc.id,
          nom: d.nom || "",
          prenom: d.prenom || "",
          classe: d.classe || "",
          sexe: d.sexe || "",
          presences: pres.present,
          absences: pres.absent,
          retards: pres.retard,
          tauxPresence,
          paiementTotal: pai.total,
          paiementPaye: pai.paye,
          paiementStatut,
        };
      });

      // Global aggregates
      const classes = [...new Set(elevesSnap.docs.map((d) => d.data().classe).filter(Boolean))];
      const elevesActifs = elevesSnap.docs.filter((d) => d.data().statut === "actif").length;
      const tauxPresenceMoyen = statsEleves.length > 0
        ? Math.round(statsEleves.reduce((acc, s) => acc + s.tauxPresence, 0) / statsEleves.length)
        : 0;

      const totalPaiements = paiementsSnap.docs.reduce((acc, d) => acc + (d.data().montantTotal || 0), 0);
      const totalPaye = paiementsSnap.docs.reduce((acc, d) => acc + (d.data().montantPaye || 0), 0);

      return {
        success: true,
        global: {
          totalEleves: elevesSnap.size,
          elevesActifs,
          totalPresences: appelsSnap.size,
          tauxPresenceMoyen,
          totalPaiements,
          totalPaye,
        },
        classes,
        eleves: statsEleves,
      };
    } catch (error) {
      handleError(error, "Erreur lors du calcul des statistiques detaillees.");
    }
  });
