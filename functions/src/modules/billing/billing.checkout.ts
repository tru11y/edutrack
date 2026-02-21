import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

interface CheckoutData {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export const createCheckoutSession = functions
  .region("europe-west1")
  .https.onCall(async (data: CheckoutData, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent gerer l'abonnement.");
    requireArgument(!!data.priceId, "priceId requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      // Dynamic import of stripe to avoid issues if not configured
      const Stripe = (await import("stripe")).default;
      const stripeKey = functions.config().stripe?.secret_key;
      if (!stripeKey) {
        throw new functions.https.HttpsError("failed-precondition", "Stripe n'est pas configure.");
      }
      const stripe = new Stripe(stripeKey);

      // Get or create Stripe customer
      const subDoc = await db.collection("school_subscriptions").doc(schoolId).get();
      const subData = subDoc.exists ? subDoc.data() : null;
      let customerId = subData?.stripeCustomerId;

      if (!customerId) {
        const schoolDoc = await db.collection("schools").doc(schoolId).get();
        const schoolData = schoolDoc.data();

        const customer = await stripe.customers.create({
          email: schoolData?.email || context.auth!.token?.email || "",
          metadata: { schoolId },
        });
        customerId = customer.id;

        await db.collection("school_subscriptions").doc(schoolId).set(
          { stripeCustomerId: customerId },
          { merge: true }
        );
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: data.priceId, quantity: 1 }],
        success_url: data.successUrl || `${functions.config().app?.url || "https://app.edutrack.com"}/billing?success=true`,
        cancel_url: data.cancelUrl || `${functions.config().app?.url || "https://app.edutrack.com"}/billing?canceled=true`,
        metadata: { schoolId },
      });

      return { success: true, sessionId: session.id, url: session.url };
    } catch (error) {
      handleError(error, "Erreur lors de la creation de la session de paiement.");
    }
  });
