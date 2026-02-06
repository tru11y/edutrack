// Export de tous les composants UI
// Single source of truth - utiliser ces imports plutot que les fichiers a la racine

export { default as Modal, ModalActions } from "./Modal";
export { default as Button } from "./Button";
export { default as Input, SearchInput } from "./Input";
export { default as Card, StatCard, ActionCard } from "./Card";
export { Card as CardComponent } from "./Card";
export { default as Select, ClassSelect } from "./Select";
export { default as Avatar, AvatarGroup } from "./Avatar";
export { default as StatusBadge, ActiveBadge, RoleBadge, PresenceBadge } from "./StatusBadge";
export { default as EmptyState, EmptyStateIcons } from "./EmptyState";
export { default as Loader } from "./Loader";
export {
  Skeleton,
  SkeletonUserCard,
  SkeletonStudentCard,
  SkeletonPresenceCard,
  SkeletonStat,
  LoadingSpinner,
} from "./Skeleton";
export { useToast, ToastProvider } from "./Toast";
