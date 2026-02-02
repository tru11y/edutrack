// Export de tous les composants UI
export { default as Modal, ModalActions } from "./Modal";
export { default as Button } from "./Button";
export { default as Input, SearchInput } from "./Input";
export { default as Card, StatCard, ActionCard } from "./Card";
export { default as Select, ClassSelect } from "./Select";
export { default as Avatar, AvatarGroup } from "./Avatar";
export { default as StatusBadge, ActiveBadge, RoleBadge, PresenceBadge } from "./StatusBadge";
export { default as EmptyState, EmptyStateIcons } from "./EmptyState";
export {
  Skeleton,
  SkeletonUserCard,
  SkeletonStudentCard,
  SkeletonPresenceCard,
  SkeletonStat,
  LoadingSpinner,
} from "./Skeleton";
export { useToast, ToastProvider } from "./Toast";
