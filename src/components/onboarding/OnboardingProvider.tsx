import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { getStepsForRole, type OnboardingStep } from "./onboarding.config";
import OnboardingTour from "./OnboardingTour";

interface OnboardingContextType {
  startOnboarding: () => void;
  restartOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  const storageKey = user?.uid ? `onboarding_completed_${user.uid}` : null;

  // Auto-start on first login
  useEffect(() => {
    if (!user?.uid || !user.role) return;

    const roleSteps = getStepsForRole(user.role);
    if (roleSteps.length === 0) return;

    setSteps(roleSteps);

    if (storageKey && !localStorage.getItem(storageKey)) {
      // Small delay to let the layout render and data-tour attributes mount
      const timer = setTimeout(() => setActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.uid, user?.role, storageKey]);

  const handleComplete = useCallback(() => {
    setActive(false);
    if (storageKey) localStorage.setItem(storageKey, "true");
  }, [storageKey]);

  const startOnboarding = useCallback(() => {
    if (!user?.role) return;
    const roleSteps = getStepsForRole(user.role);
    if (roleSteps.length > 0) {
      setSteps(roleSteps);
      setActive(true);
    }
  }, [user?.role]);

  const restartOnboarding = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey);
    startOnboarding();
  }, [storageKey, startOnboarding]);

  return (
    <OnboardingContext.Provider value={{ startOnboarding, restartOnboarding }}>
      {children}
      {active && steps.length > 0 && (
        <OnboardingTour steps={steps} onComplete={handleComplete} />
      )}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}
