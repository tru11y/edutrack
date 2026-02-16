import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../components/ui";
import {
  getUserPermissionsSecure,
  updateUserPermissionsSecure,
  getCloudFunctionErrorMessage,
} from "../services/cloudFunctions";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  DEFAULT_PERMISSIONS_BY_ROLE,
  type Permission,
} from "../constants/permissions";

interface UserRow {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  permissions: string[];
}

export default function PermissionManagement() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const toast = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const rows: UserRow[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              email: data.email || "",
              nom: data.nom || "",
              prenom: data.prenom || "",
              role: data.role || "",
              permissions: data.permissions || DEFAULT_PERMISSIONS_BY_ROLE[data.role] || [],
            };
          })
          .filter((u) => u.role === "gestionnaire" || u.role === "prof")
          .sort((a, b) => a.role.localeCompare(b.role) || a.nom.localeCompare(b.nom));
        setUsers(rows);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const togglePermission = (userId: string, perm: Permission) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const has = u.permissions.includes(perm);
        return {
          ...u,
          permissions: has
            ? u.permissions.filter((p) => p !== perm)
            : [...u.permissions, perm],
        };
      })
    );
  };

  const savePermissions = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setSaving(userId);
    try {
      await updateUserPermissionsSecure(userId, user.permissions);
      toast.success(t("permissionGranted"));
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

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
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>
          {t("managePermissions")}
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
          {language === "en"
            ? "Configure granular permissions for each user"
            : "Configurez les permissions granulaires pour chaque utilisateur"}
        </p>
      </div>

      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, position: "sticky", left: 0, background: colors.bgSecondary }}>
                  Utilisateur
                </th>
                {ALL_PERMISSIONS.map((perm) => (
                  <th key={perm} style={{ padding: "12px 8px", textAlign: "center", fontSize: 10, fontWeight: 600, color: colors.textMuted, whiteSpace: "nowrap" }}>
                    {PERMISSION_LABELS[perm][language === "en" ? "en" : "fr"]}
                  </th>
                ))}
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: colors.textMuted }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "12px 16px", position: "sticky", left: 0, background: colors.bgCard }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: colors.text, margin: 0 }}>
                        {user.prenom} {user.nom}
                      </p>
                      <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
                        {user.role} - {user.email}
                      </p>
                    </div>
                  </td>
                  {ALL_PERMISSIONS.map((perm) => (
                    <td key={perm} style={{ padding: "12px 8px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={user.permissions.includes(perm)}
                        onChange={() => togglePermission(user.id, perm)}
                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: colors.primary }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <button
                      onClick={() => savePermissions(user.id)}
                      disabled={saving === user.id}
                      style={{
                        padding: "6px 16px", background: colors.primary, color: "#fff",
                        border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500,
                        cursor: saving === user.id ? "not-allowed" : "pointer",
                        opacity: saving === user.id ? 0.7 : 1,
                      }}
                    >
                      {saving === user.id ? "..." : t("save")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
