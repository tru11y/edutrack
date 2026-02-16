import { useEffect, useState, useRef } from "react";
import { collection, addDoc, query, orderBy, serverTimestamp, Timestamp, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast, ConfirmModal } from "../components/ui";

interface UserData {
  id: string;
  email: string;
  role: "admin" | "gestionnaire" | "prof";
  nom?: string;
  prenom?: string;
  isActive?: boolean;
}

interface Attachment {
  name: string;
  url: string;
  type: string;
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
  attachments?: Attachment[];
}

export default function Messages() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const isProf = user?.role === "prof";
  const isAdminOrGest = user?.role === "admin" || user?.role === "gestionnaire";
  const isOnlyAdmin = user?.role === "admin";
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [destinataire, setDestinataire] = useState("tous");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; variant: "danger" | "warning" | "info"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "info", onConfirm: () => {} });

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
        // Messages pour les admins (visible par admins et gestionnaires)
        if (m.destinataire === "admins" && isAdminOrGest) return true;
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
  }, [user?.uid, isAdminOrGest, isProf]);

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
    if ((!newMessage.trim() && selectedFiles.length === 0) || !user) return;

    setError("");
    setSending(true);

    try {
      // Upload attachments if any
      const attachments: Attachment[] = [];
      for (const file of selectedFiles) {
        const filePath = `messages/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        attachments.push({ name: file.name, url, type: file.type });
      }

      const payload: Record<string, unknown> = {
        auteurId: user.uid,
        auteurNom: user.email?.split("@")[0] || "Utilisateur",
        auteurRole: user.role || "admin",
        contenu: newMessage.trim(),
        destinataire: destinataire,
        destinataireNom: getDestinataireNom(destinataire),
        createdAt: serverTimestamp(),
      };

      if (attachments.length > 0) {
        payload.attachments = attachments;
      }

      await addDoc(collection(db, "messages"), payload);
      setNewMessage("");
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'envoi. Verifiez votre connexion.");
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  // Filter messages by search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.contenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.auteurNom.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

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

  const handleDeleteMessage = (messageId: string) => {
    if (!isOnlyAdmin) {
      toast.warning("Seul un administrateur peut supprimer les messages.");
      return;
    }
    setConfirmState({
      isOpen: true, title: "Supprimer le message", message: "Voulez-vous vraiment supprimer ce message ?\n\nCette action est irreversible.", variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, isOpen: false }));
        try {
          await deleteDoc(doc(db, "messages", messageId));
          toast.success("Message supprime");
        } catch (err) {
          console.error(err);
          toast.error("Erreur lors de la suppression du message");
        }
      },
    });
  };

  const profs = users.filter((u) => u.role === "prof");
  const admins = users.filter((u) => u.role === "admin");

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: isProf ? colors.successBg : colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: isProf ? colors.success : colors.primary }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 12C21 16.97 16.97 21 12 21C10.36 21 8.82 20.55 7.49 19.78L3 21L4.22 16.51C3.45 15.18 3 13.64 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Messages</h1>
            <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{isProf ? "Echangez avec les admins" : "Echangez avec l'equipe"}</p>
          </div>
        </div>
      </div>

      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden", display: "flex", flexDirection: "column", height: "calc(100vh - 280px)", minHeight: 400 }}>
        {/* Search bar */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, background: colors.bgSecondary }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t("searchMessages")}...`}
            style={{ width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgCard, color: colors.text, outline: "none" }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column-reverse", gap: 16 }}>
          {filteredMessages.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 16px", color: colors.textMuted }}>
                  <path d="M21 12C21 16.97 16.97 21 12 21C10.36 21 8.82 20.55 7.49 19.78L3 21L4.22 16.51C3.45 15.18 3 13.64 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ color: colors.textMuted, fontSize: 15, margin: 0 }}>Aucun message</p>
              </div>
            </div>
          ) : (
            filteredMessages.map((message) => {
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
                      ? (isProf ? `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)` : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`)
                      : colors.bgSecondary,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                    position: "relative"
                  }}>
                    {/* Bouton supprimer (admin uniquement) */}
                    {isOnlyAdmin && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          background: isMe ? "rgba(255,255,255,0.2)" : colors.dangerBg,
                          color: isMe ? colors.onGradient : colors.danger,
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          opacity: 0.7,
                          transition: "opacity 0.2s"
                        }}
                        title="Supprimer ce message"
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M1.5 3H10.5M4.5 3V2C4.5 1.45 4.95 1 5.5 1H6.5C7.05 1 7.5 1.45 7.5 2V3M5 5.5V8.5M7 5.5V8.5M2.5 3L3 10C3 10.55 3.45 11 4 11H8C8.55 11 9 10.55 9 10L9.5 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                    {!isMe && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px" }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: isFromAdmin ? colors.primary : colors.success }}>{message.auteurNom}</p>
                        <span style={{ padding: "2px 6px", background: isFromAdmin ? colors.primaryBg : colors.successBg, color: isFromAdmin ? colors.primary : colors.success, borderRadius: 4, fontSize: 10, fontWeight: 500 }}>
                          {isFromAdmin ? "Admin" : "Prof"}
                        </span>
                      </div>
                    )}
                    {message.contenu && (
                      <p style={{ margin: 0, fontSize: 14, color: isMe ? colors.onGradient : colors.text, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word" }}>{message.contenu}</p>
                    )}
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                        {message.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              padding: "6px 10px", borderRadius: 6, fontSize: 12,
                              background: isMe ? "rgba(255,255,255,0.15)" : colors.bgSecondary,
                              color: isMe ? colors.onGradient : colors.primary,
                              textDecoration: "none",
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05L12.25 20.24C10.28 22.21 7.07 22.21 5.1 20.24C3.13 18.27 3.13 15.06 5.1 13.09L14.29 3.9C15.58 2.61 17.67 2.61 18.96 3.9C20.25 5.19 20.25 7.28 18.96 8.57L9.76 17.76C9.12 18.41 8.07 18.41 7.42 17.76C6.78 17.12 6.78 16.07 7.42 15.42L15.95 6.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{att.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
                      {destLabel && (
                        <span style={{ fontSize: 10, color: isMe ? "rgba(255,255,255,0.7)" : colors.textMuted, background: isMe ? "rgba(255,255,255,0.15)" : colors.border, padding: "2px 6px", borderRadius: 4 }}>
                          → {destLabel}
                        </span>
                      )}
                      <p style={{ margin: 0, fontSize: 11, color: isMe ? "rgba(255,255,255,0.7)" : colors.textMuted, textAlign: "right", flex: 1 }}>{formatDate(message.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} style={{ padding: 16, borderTop: `1px solid ${colors.border}`, background: colors.bgSecondary }}>
          {error && (
            <div style={{ padding: "8px 12px", background: colors.dangerBg, border: `1px solid ${colors.danger}30`, borderRadius: 8, marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: colors.danger, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Selecteur de destinataire */}
          <div style={{ marginBottom: 12 }}>
            <select
              value={destinataire}
              onChange={(e) => setDestinataire(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgInput, color: colors.text }}
            >
              <option value="tous">Tout le monde</option>
              {isAdminOrGest && <option value="admins">Admins uniquement</option>}
              {isAdminOrGest && <option value="profs">Tous les professeurs</option>}
              {isAdminOrGest && profs.length > 0 && (
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

          {/* Selected files preview */}
          {selectedFiles.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              {selectedFiles.map((f, i) => (
                <span key={i} style={{ padding: "4px 10px", background: colors.primaryBg, color: colors.primary, borderRadius: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  {f.name}
                  <button type="button" onClick={() => setSelectedFiles((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: "14px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, cursor: "pointer", color: colors.textMuted, display: "flex", alignItems: "center" }} title={t("attachments")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05L12.25 20.24C10.28 22.21 7.07 22.21 5.1 20.24C3.13 18.27 3.13 15.06 5.1 13.09L14.29 3.9C15.58 2.61 17.67 2.61 18.96 3.9C20.25 5.19 20.25 7.28 18.96 8.57L9.76 17.76C9.12 18.41 8.07 18.41 7.42 17.76C6.78 17.12 6.78 16.07 7.42 15.42L15.95 6.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} style={{ display: "none" }} />
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Ecrivez votre message..." style={{ flex: 1, padding: "14px 18px", border: `1px solid ${colors.border}`, borderRadius: 12, fontSize: 14, outline: "none", background: colors.bgInput, color: colors.text }} />
            <button type="submit" disabled={sending || (!newMessage.trim() && selectedFiles.length === 0)} style={{ padding: "14px 24px", background: sending || (!newMessage.trim() && selectedFiles.length === 0) ? colors.border : (isProf ? `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)` : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`), color: sending || (!newMessage.trim() && selectedFiles.length === 0) ? colors.textMuted : colors.onGradient, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: sending || (!newMessage.trim() && selectedFiles.length === 0) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M16.5 1.5L8.25 9.75M16.5 1.5L11.25 16.5L8.25 9.75M16.5 1.5L1.5 6.75L8.25 9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Envoyer
            </button>
          </div>
        </form>
      </div>

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
