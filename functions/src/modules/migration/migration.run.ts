import * as functions from "firebase-functions";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId, migrateDataToSchool } from "../../helpers/tenant";

/**
 * Cloud Function: runDataMigration
 * Stamps schoolId on all existing documents that don't have it.
 * Should be called once by an admin after v5 SaaS upgrade.
 */
export const runDataMigration = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .https.onCall(async (_data, context) => {
    requireAuth(context.auth?.uid);
    const isAdminUser = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdminUser, "Seuls les administrateurs peuvent effectuer la migration.");

    try {
      const schoolId = await getSchoolId(context.auth!.uid);
      const totalMigrated = await migrateDataToSchool(schoolId, true); // force overwrite wrong schoolIds
      return {
        success: true,
        schoolId,
        totalMigrated,
        message: `Migration terminee: ${totalMigrated} document(s) mis a jour.`,
      };
    } catch (error) {
      handleError(error, "Erreur lors de la migration des donnees.");
    }
  });
