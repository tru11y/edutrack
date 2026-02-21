import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";

const PLAN_MAP: Record<string, { plan: string; maxEleves: number }> = {
  price_starter: { plan: "starter", maxEleves: 200 },
  price_pro: { plan: "pro", maxEleves: 1000 },
  price_enterprise: { plan: "enterprise", maxEleves: 999999 },
};

/**
 * Stripe webhook endpoint (onRequest, not onCall).
 * Receives Stripe events and updates subscriptions accordingly.
 */
export const stripeWebhook = functions
  .region("europe-west1")
  .https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const Stripe = (await import("stripe")).default;
      const stripeKey = functions.config().stripe?.secret_key;
      const webhookSecret = functions.config().stripe?.webhook_secret;

      if (!stripeKey || !webhookSecret) {
        res.status(500).send("Stripe not configured");
        return;
      }

      const stripe = new Stripe(stripeKey);

      const sig = req.headers["stripe-signature"] as string;
      const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as { subscription?: string; metadata?: { schoolId?: string } };
          const schoolId = session.metadata?.schoolId;
          if (schoolId && session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string);
            const priceId = sub.items.data[0]?.price?.id || "";
            const planInfo = PLAN_MAP[priceId] || { plan: "starter", maxEleves: 200 };

            const subObj = sub as unknown as { current_period_end?: number };
            await db.collection("school_subscriptions").doc(schoolId).update({
              stripeSubscriptionId: session.subscription,
              plan: planInfo.plan,
              maxEleves: planInfo.maxEleves,
              status: "active",
              currentPeriodEnd: admin.firestore.Timestamp.fromMillis((subObj.current_period_end || 0) * 1000),
            });

            await db.collection("schools").doc(schoolId).update({ plan: planInfo.plan });
          }
          break;
        }

        case "customer.subscription.updated": {
          const sub = event.data.object as unknown as {
            id: string;
            status: string;
            current_period_end: number;
            items: { data: Array<{ price: { id: string } }> };
          };
          // Find school by subscription ID
          const snap = await db.collection("school_subscriptions")
            .where("stripeSubscriptionId", "==", sub.id)
            .limit(1)
            .get();

          if (!snap.empty) {
            const doc = snap.docs[0];
            const priceId = sub.items.data[0]?.price?.id || "";
            const planInfo = PLAN_MAP[priceId] || { plan: "starter", maxEleves: 200 };

            await doc.ref.update({
              plan: planInfo.plan,
              maxEleves: planInfo.maxEleves,
              status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled",
              currentPeriodEnd: admin.firestore.Timestamp.fromMillis(sub.current_period_end * 1000),
            });

            await db.collection("schools").doc(doc.id).update({ plan: planInfo.plan });
          }
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as { id: string };
          const snap = await db.collection("school_subscriptions")
            .where("stripeSubscriptionId", "==", sub.id)
            .limit(1)
            .get();

          if (!snap.empty) {
            const doc = snap.docs[0];
            await doc.ref.update({
              plan: "free",
              maxEleves: 50,
              status: "canceled",
              stripeSubscriptionId: null,
            });
            await db.collection("schools").doc(doc.id).update({ plan: "free" });
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).send("Webhook error");
    }
  });
