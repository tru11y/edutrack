import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { getQueueLength } from "../utils/offlineQueue";

export default function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const { colors } = useTheme();
  const { t } = useLanguage();

  if (isOnline) return null;

  const queueLen = getQueueLength();

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: colors.warningBg,
        borderBottom: `2px solid ${colors.warning}`,
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontSize: 14,
        fontWeight: 500,
        color: colors.warning,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 6V10M9 13H9.01M2.73 14.27L8.13 3.53C8.53 2.73 9.47 2.73 9.87 3.53L15.27 14.27C15.64 15.01 15.11 15.89 14.27 15.89H3.73C2.89 15.89 2.36 15.01 2.73 14.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>{t("offlineMessage")}</span>
      {queueLen > 0 && (
        <span style={{
          background: colors.warning,
          color: "#fff",
          padding: "2px 10px",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
        }}>
          {queueLen} {t("offlineQueueCount")}
        </span>
      )}
    </div>
  );
}
