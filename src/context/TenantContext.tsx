import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./AuthContext";

export interface SchoolSubscription {
  plan: "free" | "starter" | "pro" | "enterprise";
  maxEleves: number;
  status: "active" | "past_due" | "canceled" | "trialing";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
}

interface TenantContextType {
  schoolId: string | null;
  subscription: SchoolSubscription | null;
  loading: boolean;
}

const DEFAULT_SUBSCRIPTION: SchoolSubscription = {
  plan: "free",
  maxEleves: 50,
  status: "active",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
};

const TenantContext = createContext<TenantContextType>({
  schoolId: null,
  subscription: null,
  loading: true,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SchoolSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to user's schoolId
  useEffect(() => {
    if (!user?.uid) {
      setSchoolId(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    if (user.schoolId) {
      setSchoolId(user.schoolId);
    } else {
      setLoading(false);
    }
  }, [user?.uid, user?.schoolId]);

  // Listen to subscription
  useEffect(() => {
    if (!schoolId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "school_subscriptions", schoolId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSubscription({
            plan: data.plan || "free",
            maxEleves: data.maxEleves || 50,
            status: data.status || "active",
            stripeCustomerId: data.stripeCustomerId || null,
            stripeSubscriptionId: data.stripeSubscriptionId || null,
            currentPeriodEnd: data.currentPeriodEnd?.toDate?.()?.toISOString() || null,
          });
        } else {
          setSubscription(DEFAULT_SUBSCRIPTION);
        }
        setLoading(false);
      },
      () => {
        setSubscription(DEFAULT_SUBSCRIPTION);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [schoolId]);

  return (
    <TenantContext.Provider value={{ schoolId, subscription, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
