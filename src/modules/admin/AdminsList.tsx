import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useToast, ConfirmModal } from "../../components/ui";
import { toggleUserStatusSecure, getCloudFunctionErrorMessage } from "../../services/cloudFunctions";

interface Admin {
  id: string;
  email?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  role: string;
  isActive: boolean;
  createdAt?: { toDate: () => Date };
}

export default function AdminsList() {
  const { colors } = useTheme();
  const toast = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; variant: "danger" | "warning" | "info"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "info", onConfirm: () => {} });

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "users"));
      const data: Admin[] = [];

      snap.forEach((d) => {
        const userData = d.data();
        if (userData.role === "admin") {
          data.push({
            id: d.id,
            email: userData.email,
            nom: userData.nom,
            prenom: userData.prenom,
            telephone: userData.telephone,
            role: userData.role,
            isActive: userData.isActive ?? true,
            createdAt: userData.createdAt,
          });
        }
      });

      setAdmins(data);
      setLoading(false);
    };

    load();
  }, []);

  const toggleActive = (adminId: string, currentStatus: boolean) => {
    setConfirmState({
      isOpen: true, title: currentStatus ? "Desactiver l'admin" : "Reactiver l'admin",
      message: currentStatus ? "Desactiver cet admin ?" : "Reactiver cet admin ?",
      variant: currentStatus ? "warning" : "info",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, isOpen: false }));
        try {
          await toggleUserStatusSecure({ userId: adminId, isActive: !currentStatus });
          setAdmins((prev) =>
            prev.map((a) => (a.id === adminId ? { ...a, isActive: !currentStatus } : a))
          );
        } catch (e) {
          toast.error(getCloudFunctionErrorMessage(e));
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary,
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement des administrateurs...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: colors.primaryBg,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke={colors.primary} strokeWidth="2"/>
                <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Administrateurs</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{admins.length} compte{admins.length > 1 ? "s" : ""} admin</p>
            </div>
          </div>
          <Link
            to="/admin/admins/create"
            style={{
              padding: "10px 20px",
              background: colors.gradientPrimary,
              color: colors.onGradient,
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: colors.shadowPrimary
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Nouvel admin
          </Link>
        </div>
      </div>

      {/* List */}
      {admins.length === 0 ? (
        <div style={{
          background: colors.bgCard,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: 60,
          textAlign: "center"
        }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun administrateur trouve</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {admins.map((admin) => (
            <div
              key={admin.id}
              style={{
                background: colors.bgCard,
                borderRadius: 16,
                border: `1px solid ${colors.border}`,
                overflow: "hidden"
              }}
            >
              <div style={{
                padding: 20,
                background: colors.gradientPrimary,
                display: "flex",
                alignItems: "center",
                gap: 16
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: colors.onGradientOverlay,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: colors.onGradient, fontWeight: 600, fontSize: 18
                }}>
                  {(admin.prenom?.[0] || admin.email?.[0] || "A").toUpperCase()}
                  {(admin.nom?.[0] || "").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.onGradient, margin: "0 0 4px" }}>
                    {admin.prenom && admin.nom
                      ? `${admin.prenom} ${admin.nom}`
                      : admin.email?.split("@")[0] || "Admin"}
                  </h3>
                  <p style={{ fontSize: 13, color: colors.onGradientMuted, margin: 0 }}>
                    {admin.email || "Email non renseigne"}
                  </p>
                </div>
                <span style={{
                  padding: "4px 10px",
                  background: admin.isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                  color: colors.onGradient,
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {admin.isActive ? "Actif" : "Inactif"}
                </span>
              </div>

              <div style={{ padding: 20 }}>
                {admin.telephone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M14.67 11.27V13.27C14.67 13.74 14.29 14.13 13.81 14.13H13.67C7.23 13.67 2.33 8.77 1.87 2.33V2.19C1.87 1.71 2.26 1.33 2.73 1.33H4.73C5.13 1.33 5.48 1.61 5.56 2L6.18 5.13C6.24 5.43 6.13 5.73 5.91 5.92L4.64 7.03C5.68 9.03 7.3 10.65 9.3 11.69L10.41 10.42C10.6 10.2 10.9 10.09 11.2 10.15L14.33 10.77C14.72 10.85 15 11.2 15 11.6V11.27H14.67Z" stroke={colors.textMuted} strokeWidth="1.5"/>
                    </svg>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>{admin.telephone}</span>
                  </div>
                )}

                {admin.createdAt?.toDate && (
                  <p style={{ fontSize: 12, color: colors.textLight, margin: "0 0 16px" }}>
                    Cree le {admin.createdAt.toDate().toLocaleDateString("fr-FR")}
                  </p>
                )}

                <button
                  onClick={() => toggleActive(admin.id, admin.isActive)}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: admin.isActive ? colors.dangerBg : colors.successBg,
                    border: `1px solid ${admin.isActive ? colors.danger : colors.success}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    color: admin.isActive ? colors.danger : colors.success,
                    cursor: "pointer"
                  }}
                >
                  {admin.isActive ? "Desactiver" : "Reactiver"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
      />
    </div>
  );
}
