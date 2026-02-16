import { useLanguage } from "../context/LanguageContext";

export default function SkipToContent() {
  const { t } = useLanguage();

  return (
    <a
      href="#main-content"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "auto",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        zIndex: 9999,
        padding: "12px 24px",
        background: "#6366f1",
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
        borderRadius: "0 0 8px 0",
        textDecoration: "none",
      }}
      onFocus={(e) => {
        e.currentTarget.style.position = "fixed";
        e.currentTarget.style.left = "0";
        e.currentTarget.style.top = "0";
        e.currentTarget.style.width = "auto";
        e.currentTarget.style.height = "auto";
      }}
      onBlur={(e) => {
        e.currentTarget.style.position = "absolute";
        e.currentTarget.style.left = "-9999px";
        e.currentTarget.style.width = "1px";
        e.currentTarget.style.height = "1px";
      }}
    >
      {t("skipToContent")}
    </a>
  );
}
