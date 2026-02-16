import { db, admin } from "../firebase";

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string
): Promise<{ sent: number; failed: number }> {
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) return { sent: 0, failed: 0 };

  const fcmTokens: string[] = userSnap.data()?.fcmTokens || [];
  if (fcmTokens.length === 0) return { sent: 0, failed: 0 };

  const message = {
    notification: { title, body },
    tokens: fcmTokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    // Cleanup invalid tokens
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, i) => {
      if (
        !resp.success &&
        resp.error &&
        (resp.error.code === "messaging/invalid-registration-token" ||
          resp.error.code === "messaging/registration-token-not-registered")
      ) {
        invalidTokens.push(fcmTokens[i]);
      }
    });

    if (invalidTokens.length > 0) {
      await db
        .collection("users")
        .doc(userId)
        .update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
        });
    }

    return {
      sent: response.successCount,
      failed: response.failureCount,
    };
  } catch {
    return { sent: 0, failed: fcmTokens.length };
  }
}
