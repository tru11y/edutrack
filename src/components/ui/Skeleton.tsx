import { useTheme } from "../../context/ThemeContext";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
}: SkeletonProps) {
  const { colors } = useTheme();

  return (
    <>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div
        style={{
          width,
          height,
          borderRadius,
          background: colors.bgSecondary,
          animation: "skeletonPulse 1.5s ease-in-out infinite",
        }}
      />
    </>
  );
}

// Skeleton pour une carte utilisateur
export function SkeletonUserCard() {
  const { colors } = useTheme();

  return (
    <div
      style={{
        background: colors.bgCard,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Skeleton width={44} height={44} borderRadius={12} />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={16} borderRadius={6} />
        <div style={{ marginTop: 8 }}>
          <Skeleton width="40%" height={12} borderRadius={4} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Skeleton width={70} height={28} borderRadius={20} />
        <Skeleton width={60} height={28} borderRadius={8} />
      </div>
    </div>
  );
}

// Skeleton pour une carte eleve
export function SkeletonStudentCard() {
  const { colors } = useTheme();

  return (
    <div
      style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        padding: 20,
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <Skeleton width={64} height={64} borderRadius={16} />
      </div>
      <Skeleton width="70%" height={18} borderRadius={6} />
      <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
        <Skeleton width="50%" height={14} borderRadius={4} />
      </div>
    </div>
  );
}

// Skeleton pour une carte de presence
export function SkeletonPresenceCard() {
  const { colors } = useTheme();

  return (
    <div
      style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Skeleton width={48} height={48} borderRadius={12} />
          <div>
            <Skeleton width={120} height={18} borderRadius={6} />
            <div style={{ marginTop: 8 }}>
              <Skeleton width={180} height={14} borderRadius={4} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Skeleton width={80} height={28} borderRadius={8} />
          <Skeleton width={90} height={28} borderRadius={8} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Skeleton width={100} height={28} borderRadius={8} />
        <Skeleton width={90} height={28} borderRadius={8} />
        <Skeleton width={80} height={28} borderRadius={8} />
      </div>
    </div>
  );
}

// Skeleton pour les stats
export function SkeletonStat() {
  const { colors } = useTheme();

  return (
    <div
      style={{
        background: colors.bgSecondary,
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${colors.border}`,
      }}
    >
      <Skeleton width="60%" height={14} borderRadius={4} />
      <div style={{ marginTop: 12 }}>
        <Skeleton width="40%" height={32} borderRadius={6} />
      </div>
    </div>
  );
}

// Loader spinner avec texte
export function LoadingSpinner({ text = "Chargement..." }: { text?: string }) {
  const { colors } = useTheme();

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: `3px solid ${colors.border}`,
              borderTopColor: colors.primary,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>{text}</p>
        </div>
      </div>
    </>
  );
}
