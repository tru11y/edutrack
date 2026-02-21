import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const createBillingPortalSession = functions
  .region("europe-west1")
  .https.onCall(async (data: { returnUrl?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent gerer l'abonnement.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const Stripe = (await import("stripe")).default;
      const stripeKey = functions.config().stripe?.secret_key;
      if (!stripeKey) {
        throw new functions.https.HttpsError("failed-precondition", "Stripe n'est pas configure.");
      }
      const stripe = new Stripe(stripeKey);

      const subDoc = await db.collection("school_subscriptions").doc(schoolId).get();
      const customerId = subDoc.data()?.stripeCustomerId;

      if (!customerId) {
        throw new functions.https.HttpsError("failed-precondition", "Aucun compte de facturation trouve.");
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: data.returnUrl || `${functions.config().app?.url || "https://app.edutrack.com"}/billing`,
      });

      return { success: true, url: session.url };
    } catch (error) {
      handleError(error, "Erreur lors de la creation du portail de facturation.");
    }
  });
