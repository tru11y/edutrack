import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/ui";
import {
  getNotificationConfigSecure,
  updateNotificationConfigSecure,
  getCloudFunctionErrorMessage,
} from "../../services/cloudFunctions";

interface Config {
  autoAbsenceNotif: boolean;
  autoImpayeNotif: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  webhookUrls: string[];
}

const DEFAULT_CONFIG: Config = {
  autoAbsenceNotif: true,
  autoImpayeNotif: true,
  inAppEnabled: true,
  smsEnabled: false,
  emailEnabled: false,
  webhookUrls: [],
};

export default function NotificationConfig() {
  const { colors } = useTheme();
  const toast = useToast();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newWebhook, setNewWebhook] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await getNotificationConfigSecure();
      if (res.config) {
        setConfig({ ...DEFAULT_CONFIG, ...(res.config as Partial<Config>) });
      }
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      await updateNotificationConfigSecure(config as unknown as Record<string, unknown>);
      toast.success("Configuration sauvegardee");
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function addWebhook() {
    const url = newWebhook.trim();
    if (!url) return;
    try { new URL(url); } catch { toast.error("URL invalide"); return; }
    setConfig({ ...config, webhookUrls: [...config.webhookUrls, url] });
    setNewWebhook("");
  }

  function removeWebhook(idx: number) {
    setConfig({ ...config, webhookUrls: config.webhookUrls.filter((_, i) => i !== idx) });
  }

  const toggleStyle = (enabled: boolean) => ({
    width: 44, height: 24, borderRadius: 12,
    background: enabled ? colors.success : colors.bgSecondary,
    border: `1px solid ${enabled ? colors.success : colors.border}`,
    cursor: "pointer", position: "relative" as const,
    transition: "background 0.2s",
  });

  const dotStyle = (enabled: boolean) => ({
    width: 18, height: 18, borderRadius: "50%",
    background: colors.bgCard, position: "absolute" as const,
    top: 2, left: enabled ? 22 : 2,
    transition: "left 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Configuration des notifications</h1>
        <p style={{ fontSize: 14, color: colors.textMuted, margin: "4px 0 0" }}>
          Gerez les canaux et les notifications automatiques
        </p>
      </div>

      {/* Auto notifications */}
      <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>Notifications automatiques</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: colors.text, fontSize: 14 }}>Absences</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>Notifier les parents automatiquement en cas d'absence</p>
            </div>
            <button onClick={() => setConfig({ ...config, autoAbsenceNotif: !config.autoAbsenceNotif })} style={toggleStyle(config.autoAbsenceNotif)}>
              <div style={dotStyle(config.autoAbsenceNotif)} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: colors.text, fontSize: 14 }}>Impayes</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>Notifier les parents en cas de paiement en retard</p>
            </div>
            <button onClick={() => setConfig({ ...config, autoImpayeNotif: !config.autoImpayeNotif })} style={toggleStyle(config.autoImpayeNotif)}>
              <div style={dotStyle(config.autoImpayeNotif)} />
            </button>
          </div>
        </div>
      </div>

      {/* Channels */}
      <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>Canaux de notification</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: colors.text, fontSize: 14 }}>In-app</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>Notifications dans l'application (cloche)</p>
            </div>
            <button onClick={() => setConfig({ ...config, inAppEnabled: !config.inAppEnabled })} style={toggleStyle(config.inAppEnabled)}>
              <div style={dotStyle(config.inAppEnabled)} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: colors.text, fontSize: 14 }}>SMS</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>Necessite la configuration d'un webhook (ex: Twilio)</p>
            </div>
            <button onClick={() => setConfig({ ...config, smsEnabled: !config.smsEnabled })} style={toggleStyle(config.smsEnabled)}>
              <div style={dotStyle(config.smsEnabled)} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: colors.text, fontSize: 14 }}>Email</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>Necessite la configuration d'un webhook (ex: SendGrid)</p>
            </div>
            <button onClick={() => setConfig({ ...config, emailEnabled: !config.emailEnabled })} style={toggleStyle(config.emailEnabled)}>
              <div style={dotStyle(config.emailEnabled)} />
            </button>
          </div>
        </div>
      </div>

      {/* Webhooks */}
      <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>Webhooks</h2>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 12px" }}>
          Les notifications en attente seront envoyees vers ces URLs. Connectez Twilio, SendGrid, ou tout autre service.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="url"
            placeholder="https://api.example.com/webhook"
            value={newWebhook}
            onChange={(e) => setNewWebhook(e.target.value)}
            style={{ flex: 1, padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgCard, color: colors.text }}
          />
          <button onClick={addWebhook} style={{ padding: "10px 16px", background: colors.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Ajouter
          </button>
        </div>

        {config.webhookUrls.length === 0 ? (
          <p style={{ fontSize: 12, color: colors.textMuted, fontStyle: "italic" }}>Aucun webhook configure</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {config.webhookUrls.map((url, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: colors.bgHover, borderRadius: 8 }}>
                <span style={{ flex: 1, fontSize: 12, color: colors.text, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
                <button onClick={() => removeWebhook(i)} style={{ padding: "4px 8px", background: colors.dangerBg, color: colors.danger, border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <button
        onClick={saveConfig}
        disabled={saving}
        style={{
          padding: "12px 32px", background: colors.primary, color: "#fff",
          border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500,
          cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Sauvegarde..." : "Sauvegarder la configuration"}
      </button>
    </div>
  );
}
