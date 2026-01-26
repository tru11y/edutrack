import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

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
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

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

  const toggleActive = async (adminId: string, currentStatus: boolean) => {
    if (!confirm(currentStatus ? "Desactiver cet admin ?" : "Reactiver cet admin ?")) return;

    await updateDoc(doc(db, "users", adminId), {
      isActive: !currentStatus,
    });

    setAdmins((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, isActive: !currentStatus } : a))
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#6366f1",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement des administrateurs...</p>
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
              background: "#eef2ff",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="#6366f1" strokeWidth="2"/>
                <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Administrateurs</h1>
              <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>{admins.length} compte{admins.length > 1 ? "s" : ""} admin</p>
            </div>
          </div>
          <Link
            to="/admin/admins/create"
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 14px -3px rgba(99, 102, 241, 0.4)"
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
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          padding: 60,
          textAlign: "center"
        }}>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Aucun administrateur trouve</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {admins.map((admin) => (
            <div
              key={admin.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                overflow: "hidden"
              }}
            >
              <div style={{
                padding: 20,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                gap: 16
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 600, fontSize: 18
                }}>
                  {(admin.prenom?.[0] || admin.email?.[0] || "A").toUpperCase()}
                  {(admin.nom?.[0] || "").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>
                    {admin.prenom && admin.nom
                      ? `${admin.prenom} ${admin.nom}`
                      : admin.email?.split("@")[0] || "Admin"}
                  </h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>
                    {admin.email || "Email non renseigne"}
                  </p>
                </div>
                <span style={{
                  padding: "4px 10px",
                  background: admin.isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                  color: "#fff",
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
                      <path d="M14.67 11.27V13.27C14.67 13.74 14.29 14.13 13.81 14.13H13.67C7.23 13.67 2.33 8.77 1.87 2.33V2.19C1.87 1.71 2.26 1.33 2.73 1.33H4.73C5.13 1.33 5.48 1.61 5.56 2L6.18 5.13C6.24 5.43 6.13 5.73 5.91 5.92L4.64 7.03C5.68 9.03 7.3 10.65 9.3 11.69L10.41 10.42C10.6 10.2 10.9 10.09 11.2 10.15L14.33 10.77C14.72 10.85 15 11.2 15 11.6V11.27H14.67Z" stroke="#64748b" strokeWidth="1.5"/>
                    </svg>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{admin.telephone}</span>
                  </div>
                )}

                {admin.createdAt?.toDate && (
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 16px" }}>
                    Cree le {admin.createdAt.toDate().toLocaleDateString("fr-FR")}
                  </p>
                )}

                <button
                  onClick={() => toggleActive(admin.id, admin.isActive)}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: admin.isActive ? "#fef2f2" : "#ecfdf5",
                    border: `1px solid ${admin.isActive ? "#fecaca" : "#a7f3d0"}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    color: admin.isActive ? "#dc2626" : "#059669",
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
    </div>
  );
}
