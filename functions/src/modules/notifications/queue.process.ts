import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";

// Scheduled function to process pending notifications (webhook delivery)
export const processNotificationQueue = functions
  .region("europe-west1")
  .pubsub.schedule("every 5 minutes")
  .onRun(async () => {
    try {
      const pendingSnap = await db.collection("notifications")
        .where("status", "==", "pending")
        .limit(100)
        .get();

      if (pendingSnap.empty) return;

      // Cache configs per school to avoid repeated reads
      const configCache: Record<string, FirebaseFirestore.DocumentData | null> = {};

      const batch = db.batch();

      for (const doc of pendingSnap.docs) {
        const notification = doc.data();
        const notifSchoolId = notification.schoolId;

        // Load config for this notification's school (cached)
        if (notifSchoolId && !(notifSchoolId in configCache)) {
          const configDoc = await db.collection("notification_config").doc(notifSchoolId).get();
          configCache[notifSchoolId] = configDoc.exists ? configDoc.data()! : null;
        }

        const config = notifSchoolId ? configCache[notifSchoolId] : null;
        const webhookUrls = config?.webhookUrls || {};
        const channel = notification.channel;
        const webhookUrl = webhookUrls[channel];

        if (webhookUrl) {
          try {
            // Call the webhook
            const response = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: notification.type,
                recipientId: notification.recipientId,
                channel: notification.channel,
                payload: notification.payload,
              }),
            });

            batch.update(doc.ref, {
              status: response.ok ? "sent" : "failed",
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          } catch {
            batch.update(doc.ref, {
              status: "failed",
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        } else {
          // No webhook configured, mark as sent (in_app only)
          batch.update(doc.ref, {
            status: "sent",
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error("Error processing notification queue:", error);
    }
  });
