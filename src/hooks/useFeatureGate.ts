import { useTenant } from "../context/TenantContext";
import { PLANS, FEATURE_PLAN_MAP } from "../constants/plans";

const PLAN_ORDER = ["free", "starter", "pro", "enterprise"] as const;

export function useFeatureGate() {
  const { subscription } = useTenant();
  const currentPlan = subscription?.plan || "free";
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);

  function hasFeature(featureName: string): boolean {
    const requiredPlan = FEATURE_PLAN_MAP[featureName];
    if (!requiredPlan) return true; // Feature not gated
    const requiredIndex = PLAN_ORDER.indexOf(requiredPlan);
    return currentPlanIndex >= requiredIndex;
  }

  function canAddStudent(): boolean {
    const plan = PLANS.find((p) => p.id === currentPlan);
    if (!plan) return false;
    // Note: actual student count should be checked against Firestore
    return plan.maxEleves === Infinity || plan.maxEleves > 0;
  }

  function getRequiredPlan(featureName: string): string | null {
    const requiredPlan = FEATURE_PLAN_MAP[featureName];
    if (!requiredPlan) return null;
    const requiredIndex = PLAN_ORDER.indexOf(requiredPlan);
    if (currentPlanIndex >= requiredIndex) return null;
    return requiredPlan;
  }

  return { hasFeature, canAddStudent, getRequiredPlan, currentPlan };
}
