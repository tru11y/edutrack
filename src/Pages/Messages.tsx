import { useEffect, useState } from "react";
import { collection, addDoc, query, orderBy, serverTimestamp, Timestamp, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

interface UserData {
  id: string;
  email: string;
  role: "admin" | "gestionnaire" | "prof";
  nom?: string;
  prenom?: string;
  isActive?: boolean;
}

interface Message {
  id: string;
  auteurId: string;
  auteurNom: string;
  auteurRole?: string;
  contenu: string;
  destinataire: string; // "tous" | "admins" | "profs" | userId
  destinataireNom?: string;
  createdAt?: Timestamp;
}

export default function Messages() {
  const { user } = useAuth();
  const isProf = user?.role === "prof";
  const isAdmin = user?.role === "admin" || user?.role === "gestionnaire";
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [destinataire, setDestinataire] = useState("tous");
  const [error, setError] = useState("");

  // Listener temps reel pour les utilisateurs
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserData[];
      setUsers(data.filter((u) => u.isActive !== false));
    }, (err) => {
      console.error("Erreur users:", err);
    });

    return () => unsubUsers();
  }, []);

  // Listener temps reel pour les messages
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubMessages = onSnapshot(q, (snap) => {
      const allMessages = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[];

      // Filtrer les messages selon le role de l'utilisateur
      const filteredMessages = allMessages.filter((m) => {
        // Messages envoyes par moi
        if (m.auteurId === user?.uid) return true;
        // Messages pour tout le monde
        if (m.destinataire === "tous") return true;
        // Messages pour les admins (visible par admins)
        if (m.destinataire === "admins" && isAdmin) return true;
        // Messages pour les profs (visible par profs)
        if (m.destinataire === "profs" && isProf) return true;
        // Messages prives pour moi
        if (m.destinataire === user?.uid) return true;
        return false;
      });

      setMessages(filteredMessages);
      setLoading(false);
    }, (err) => {
      console.error("Erreur messages:", err);
      setLoading(false);
    });

    return () => unsubMessages();
  }, [user?.uid, isAdmin, isProf]);

  const getDestinataireNom = (dest: string): string => {
    if (dest === "tous") return "Tout le monde";
    if (dest === "admins") return "Admins";
    if (dest === "profs") return "Professeurs";
    const u = users.find((x) => x.id === dest);
    if (u) return u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email.split("@")[0];
    return "";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setError("");
    setSending(true);

    try {
      const payload: Record<string, unknown> = {
        auteurId: user.uid,
        auteurNom: user.email?.split("@")[0] || "Utilisateur",
        auteurRole: user.role || "admin",
        contenu: newMessage.trim(),
        destinataire: destinataire,
        destinataireNom: getDestinataireNom(destinataire),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "messages"), payload);
      setNewMessage("");
      // Le listener temps reel va automatiquement mettre a jour les messages
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'envoi. Verifiez votre connexion.");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return `Aujourd'hui ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
      if (days === 1) return `Hier ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const getDestinataireLabel = (msg: Message) => {
    if (msg.destinataire === "tous") return null;
    if (msg.destinataire === "admins") return "Admins";
    if (msg.destinataire === "profs") return "Profs";
    return msg.destinataireNom || "Prive";
  };

  const profs = users.filter((u) => u.role === "prof");
  const admins = users.filter((u) => u.role === "admin");

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: isProf ? "#ecfdf5" : "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: isProf ? "#10b981" : "#6366f1" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 12C21 16.97 16.97 21 12 21C10.36 21 8.82 20.55 7.49 19.78L3 21L4.22 16.51C3.45 15.18 3 13.64 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Messages</h1>
            <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>{isProf ? "Echangez avec les admins" : "Echangez avec l'equipe"}</p>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", height: "calc(100vh - 280px)", minHeight: 400 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column-reverse", gap: 16 }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 16px", color: "#cbd5e1" }}>
                  <path d="M21 12C21 16.97 16.97 21 12 21C10.36 21 8.82 20.55 7.49 19.78L3 21L4.22 16.51C3.45 15.18 3 13.64 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>Aucun message</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isMe = message.auteurId === user?.uid;
              const isFromAdmin = message.auteurRole === "admin";
              const destLabel = getDestinataireLabel(message);
              return (
                <div key={message.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "70%",
                    padding: 16,
                    borderRadius: 16,
                    background: isMe
                      ? (isProf ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)")
                      : "#f1f5f9",
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4
                  }}>
                    {!isMe && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px" }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: isFromAdmin ? "#6366f1" : "#10b981" }}>{message.auteurNom}</p>
                        <span style={{ padding: "2px 6px", background: isFromAdmin ? "#eef2ff" : "#ecfdf5", color: isFromAdmin ? "#6366f1" : "#10b981", borderRadius: 4, fontSize: 10, fontWeight: 500 }}>
                          {isFromAdmin ? "Admin" : "Prof"}
                        </span>
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: 14, color: isMe ? "#fff" : "#1e293b", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{message.contenu}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
                      {destLabel && (
                        <span style={{ fontSize: 10, color: isMe ? "rgba(255,255,255,0.7)" : "#94a3b8", background: isMe ? "rgba(255,255,255,0.15)" : "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>
                          → {destLabel}
                        </span>
                      )}
                      <p style={{ margin: 0, fontSize: 11, color: isMe ? "rgba(255,255,255,0.7)" : "#94a3b8", textAlign: "right", flex: 1 }}>{formatDate(message.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} style={{ padding: 16, borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
          {error && (
            <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Selecteur de destinataire */}
          <div style={{ marginBottom: 12 }}>
            <select
              value={destinataire}
              onChange={(e) => setDestinataire(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff" }}
            >
              <option value="tous">Tout le monde</option>
              {isAdmin && <option value="admins">Admins uniquement</option>}
              {isAdmin && <option value="profs">Tous les professeurs</option>}
              {isAdmin && profs.length > 0 && (
                <optgroup label="Ecrire a un professeur">
                  {profs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.prenom && p.nom ? `${p.prenom} ${p.nom}` : p.email.split("@")[0]}
                    </option>
                  ))}
                </optgroup>
              )}
              {isProf && <option value="admins">Admins uniquement</option>}
              {isProf && admins.length > 0 && (
                <optgroup label="Ecrire a un admin">
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.prenom && a.nom ? `${a.prenom} ${a.nom}` : a.email.split("@")[0]}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Ecrivez votre message..." style={{ flex: 1, padding: "14px 18px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, outline: "none", background: "#fff" }} />
            <button type="submit" disabled={sending || !newMessage.trim()} style={{ padding: "14px 24px", background: sending || !newMessage.trim() ? "#e2e8f0" : (isProf ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"), color: sending || !newMessage.trim() ? "#94a3b8" : "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: sending || !newMessage.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M16.5 1.5L8.25 9.75M16.5 1.5L11.25 16.5L8.25 9.75M16.5 1.5L1.5 6.75L8.25 9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
