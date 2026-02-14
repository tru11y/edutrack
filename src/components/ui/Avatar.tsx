import { useTheme } from "../../context/ThemeContext";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
type AvatarVariant = "default" | "male" | "female" | "admin" | "gestionnaire" | "prof";

interface AvatarProps {
  name?: string;
  email?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  src?: string;
  className?: string;
}

const sizeMap: Record<AvatarSize, { size: number; fontSize: number; borderRadius: number }> = {
  xs: { size: 28, fontSize: 11, borderRadius: 6 },
  sm: { size: 32, fontSize: 12, borderRadius: 8 },
  md: { size: 44, fontSize: 16, borderRadius: 12 },
  lg: { size: 64, fontSize: 24, borderRadius: 16 },
  xl: { size: 80, fontSize: 28, borderRadius: 20 },
};

function getVariantColors(colors: ReturnType<typeof useTheme>["colors"]): Record<AvatarVariant, { bg: string; color: string; gradient?: string }> {
  return {
    default: { bg: colors.border, color: colors.textMuted },
    male: { bg: colors.maleBg, color: colors.maleText },
    female: { bg: colors.femaleBg, color: colors.femaleText },
    admin: { bg: colors.primaryBg, color: colors.primary, gradient: colors.gradientPrimary },
    gestionnaire: { bg: colors.warningBg, color: colors.warning, gradient: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.warning} 100%)` },
    prof: { bg: colors.successBg, color: colors.success, gradient: `linear-gradient(135deg, ${colors.success} 0%, ${colors.success} 100%)` },
  };
}

export default function Avatar({
  name,
  email,
  size = "md",
  variant = "default",
  src,
}: AvatarProps) {
  const { colors } = useTheme();
  const sizeConfig = sizeMap[size];
  const variantColors = getVariantColors(colors);
  const colorConfig = variantColors[variant];

  // Obtenir les initiales
  const getInitials = (): string => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  // Si on a une image
  if (src) {
    return (
      <div
        style={{
          width: sizeConfig.size,
          height: sizeConfig.size,
          borderRadius: sizeConfig.borderRadius,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={src}
          alt={name || email || "Avatar"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    );
  }

  // Avatar avec initiales
  const useGradient = ["admin", "gestionnaire", "prof"].includes(variant);

  return (
    <div
      style={{
        width: sizeConfig.size,
        height: sizeConfig.size,
        borderRadius: sizeConfig.borderRadius,
        background: useGradient ? colorConfig.gradient : colorConfig.bg,
        color: useGradient ? colors.onGradient : colorConfig.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: sizeConfig.fontSize,
        flexShrink: 0,
        border: useGradient ? "none" : `1px solid ${colors.border}`,
      }}
      title={name || email}
    >
      {getInitials()}
    </div>
  );
}

// Avatar groupe (pour afficher plusieurs avatars empiles)
interface AvatarGroupProps {
  avatars: Array<{ name?: string; email?: string; variant?: AvatarVariant }>;
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({ avatars, max = 4, size = "sm" }: AvatarGroupProps) {
  const { colors } = useTheme();
  const sizeConfig = sizeMap[size];
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          style={{
            marginLeft: index > 0 ? -sizeConfig.size / 3 : 0,
            position: "relative",
            zIndex: visibleAvatars.length - index,
          }}
        >
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          style={{
            marginLeft: -sizeConfig.size / 3,
            width: sizeConfig.size,
            height: sizeConfig.size,
            borderRadius: sizeConfig.borderRadius,
            background: colors.bgSecondary,
            color: colors.textMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: sizeConfig.fontSize * 0.8,
            fontWeight: 600,
            border: `2px solid ${colors.bgCard}`,
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
