import * as functions from "firebase-functions";

export function handleError(error: unknown, fallbackMessage: string): never {
  if (error instanceof functions.https.HttpsError) throw error;
  console.error(fallbackMessage, error);
  throw new functions.https.HttpsError("internal", fallbackMessage);
}

export function requireAuth(uid: string | undefined): asserts uid is string {
  if (!uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Vous devez etre connecte."
    );
  }
}

export function requirePermission(allowed: boolean, message?: string): void {
  if (!allowed) {
    throw new functions.https.HttpsError(
      "permission-denied",
      message || "Acces refuse."
    );
  }
}

export function requireArgument(condition: boolean, message: string): void {
  if (!condition) {
    throw new functions.https.HttpsError("invalid-argument", message);
  }
}

export function notFound(message: string): never {
  throw new functions.https.HttpsError("not-found", message);
}
