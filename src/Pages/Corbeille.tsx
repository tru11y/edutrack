import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTheme } from "../context/ThemeContext";
import { useToast, ConfirmModal } from "../components/ui";
import { useTenant } from "../context/TenantContext";
import type { Timestamp } from "firebase/firestore";

interface TrashItem {
  id: string;
  type: string;
  originalId: string;
  data: Record<string, unknown>;
  deletedAt?: Timestamp;
}

export default function Corbeille() {
  const { colors } = useTheme();
  const toast = useToast();
  const { schoolId } = useTenant();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; variant: "danger" | "warning" | "info"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "info", onConfirm: () => {} });

  const loadItems = async () => {
    try {
      const q = schoolId
        ? query(collection(db, "corbeille"), where("schoolId", "==", schoolId))
        : collection(db, "corbeille");
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as TrashItem[];
      // Sort by deletedAt descending
      setItems(data.sort((a, b) => {
        const aTime = a.deletedAt?.toMillis() || 0;
        const bTime = b.deletedAt?.toMillis() || 0;
        return bTime - aTime;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleRestore = (item: TrashItem) => {
    setConfirmState({
      isOpen: true, title: "Restaurer", message: "Restaurer cet element ?", variant: "info",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, isOpen: false }));
        setRestoring(item.id);
        try {
          await addDoc(collection(db, item.type), { ...item.data, restoredAt: serverTimestamp() });
          await deleteDoc(doc(db, "corbeille", item.id));
          await loadItems();
          toast.success("Element restaure");
        } catch (err) {
          console.error(err);
          toast.error("Erreur lors de la restauration");
        } finally {
          setRestoring(null);
        }
      },
    });
  };

  const handleDeletePermanently = (item: TrashItem) => {
    setConfirmState({
      isOpen: true, title: "Suppression definitive", message: "Supprimer definitivement cet element ?\n\nCette action est irreversible.", variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, isOpen: false }));
        try {
          await deleteDoc(doc(db, "corbeille", item.id));
          await loadItems();
          toast.success("Element supprime");
        } catch (err) {
          console.error(err);
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const handleEmptyTrash = () => {
    if (items.length === 0) return;
    setConfirmState({
      isOpen: true, title: "Vider la corbeille", message: `${items.length} element(s) seront supprimes definitivement.\n\nCette action est irreversible.`, variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, isOpen: false }));
        try {
          for (const item of items) {
            await deleteDoc(doc(db, "corbeille", item.id));
          }
          await loadItems();
          toast.success("Corbeille videe");
        } catch (err) {
          console.error(err);
          toast.error("Erreur lors du vidage de la corbeille");
        }
      },
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "cahier": return "Cahier de texte";
      case "eleves": return "Eleve";
      case "paiements": return "Paiement";
      case "presences": return "Presence";
      case "messages": return "Message";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "cahier": return { bg: colors.primaryBg, color: colors.primary };
      case "eleves": return { bg: colors.primaryBg, color: colors.primary };
      case "paiements": return { bg: colors.warningBg, color: colors.warning };
      case "presences": return { bg: colors.successBg, color: colors.success };
      case "messages": return { bg: colors.dangerBg, color: colors.danger };
      default: return { bg: colors.bgSecondary, color: colors.textMuted };
    }
  };

  const getItemDescription = (item: TrashItem) => {
    const data = item.data;
    switch (item.type) {
      case "cahier":
        return `${data.classe || "?"} - ${data.date || "?"}`;
      case "eleves":
        return `${data.prenom || ""} ${data.nom || ""}`;
      case "paiements":
        return `${data.eleveNom || "?"} - ${data.mois || "?"}`;
      case "presences":
        return `${data.classe || "?"} - ${data.date || "?"}`;
      case "messages":
        return `${(data.contenu as string || "").slice(0, 50)}...`;
      default:
        return item.originalId;
    }
  };

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.textMuted, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: colors.textMuted, textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.dangerBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.danger }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 6H21M5 6V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V6M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6M10 11V17M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Corbeille</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{items.length} element{items.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              style={{
                padding: "12px 20px",
                background: colors.dangerBg,
                color: colors.danger,
                border: `1px solid ${colors.danger}`,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2.25 4.5H15.75M6.75 4.5V3C6.75 2.17 7.42 1.5 8.25 1.5H9.75C10.58 1.5 11.25 2.17 11.25 3V4.5M7.5 8.25V12.75M10.5 8.25V12.75M3.75 4.5L4.5 15C4.5 15.83 5.17 16.5 6 16.5H12C12.83 16.5 13.5 15.83 13.5 15L14.25 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Vider la corbeille
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 16px", color: colors.textMuted }}>
            <path d="M3 6H21M5 6V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V6M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6M10 11V17M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>La corbeille est vide</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item) => {
            const typeColor = getTypeColor(item.type);
            return (
              <div
                key={item.id}
                style={{
                  background: colors.bgCard,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: typeColor.bg,
                    color: typeColor.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 12
                  }}>
                    {item.type.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ margin: 0, fontWeight: 500, color: colors.text }}>
                        {getItemDescription(item)}
                      </p>
                      <span style={{ padding: "2px 8px", background: typeColor.bg, color: typeColor.color, borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: colors.textLight }}>
                      Supprime le {formatDate(item.deletedAt)}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => handleRestore(item)}
                    disabled={restoring === item.id}
                    style={{
                      padding: "8px 14px",
                      background: colors.successBg,
                      color: colors.success,
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: restoring === item.id ? "not-allowed" : "pointer",
                      opacity: restoring === item.id ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1.75 7C1.75 4.1 4.1 1.75 7 1.75C9.9 1.75 12.25 4.1 12.25 7C12.25 9.9 9.9 12.25 7 12.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      <path d="M4.67 4.08L1.75 1.75V4.67L4.67 4.08Z" fill="currentColor"/>
                    </svg>
                    {restoring === item.id ? "..." : "Restaurer"}
                  </button>
                  <button
                    onClick={() => handleDeletePermanently(item)}
                    style={{
                      padding: "8px 14px",
                      background: colors.dangerBg,
                      color: colors.danger,
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1.75 3.5H12.25M5.25 3.5V2.33C5.25 1.69 5.77 1.17 6.42 1.17H7.58C8.23 1.17 8.75 1.69 8.75 2.33V3.5M5.83 6.42V10.08M8.17 6.42V10.08M2.92 3.5L3.5 11.67C3.5 12.31 4.02 12.83 4.67 12.83H9.33C9.98 12.83 10.5 12.31 10.5 11.67L11.08 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
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
