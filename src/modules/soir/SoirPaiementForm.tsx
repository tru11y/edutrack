import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";

interface SoirEleve {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
}

interface PaiementForm {
  eleveId: string;
  eleveNom: string;
  elevePrenom: string;
  mois: string;
  montantTotal: number;
  montantPaye: number;
  methode: string;
  datePaiement: string;
  notes: string;
}

const EMPTY: PaiementForm = {
  eleveId: "",
  eleveNom: "",
  elevePrenom: "",
  mois: new Date().toISOString().slice(0, 7),
  montantTotal: 10000,
  montantPaye: 0,
  methode: "especes",
  datePaiement: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function SoirPaiementForm() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { schoolId } = useTenant();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [eleves, setEleves] = useState<SoirEleve[]>([]);
  const [form, setForm] = useState<PaiementForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEleves = async () => {
      const q = schoolId
        ? query(collection(db, "eleves"), where("schoolId", "==", schoolId), where("programme", "==", "soir"))
        : query(collection(db, "eleves"), where("programme", "==", "soir"));
      const snap = await getDocs(q);
      setEleves(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SoirEleve)).sort((a, b) => a.nom.localeCompare(b.nom)));
    };
    loadEleves();
  }, [schoolId]);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "paiements", id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          eleveId: d.eleveId || "",
          eleveNom: d.eleveNom || "",
          elevePrenom: d.elevePrenom || "",
          mois: d.mois || EMPTY.mois,
          montantTotal: d.montantTotal || 0,
          montantPaye: d.montantPaye || 0,
          methode: d.methode || "especes",
          datePaiement: d.datePaiement?.toDate?.()?.toISOString().slice(0, 10) || EMPTY.datePaiement,
          notes: d.notes || "",
        });
      }
    });
  }, [id]);

  const handleEleveChange = (eleveId: string) => {
    const e = eleves.find((el) => el.id === eleveId);
    setForm((f) => ({
      ...f,
      eleveId,
      eleveNom: e?.nom || "",
      elevePrenom: e?.prenom || "",
    }));
  };

  const statut = form.montantPaye === 0 ? "impaye" : form.montantPaye >= form.montantTotal ? "paye" : "partiel";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.eleveId || !form.mois) { setError("Élève et mois sont obligatoires."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        eleveId: form.eleveId,
        eleveNom: form.eleveNom,
        elevePrenom: form.elevePrenom,
        mois: form.mois,
        montantTotal: form.montantTotal,
        montantPaye: form.montantPaye,
        montantRestant: Math.max(0, form.montantTotal - form.montantPaye),
        statut,
        methode: form.methode,
        datePaiement: new Date(form.datePaiement),
        notes: form.notes,
        programme: "soir",
        schoolId: schoolId || null,
        updatedAt: serverTimestamp(),
        createdByName: user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : user?.email,
      };

      if (isEditing && id) {
        await setDoc(doc(db, "paiements", id), payload, { merge: true });
      } else {
        await addDoc(collection(db, "paiements"), { ...payload, createdAt: serverTimestamp() });
      }
      navigate("/cours-du-soir/paiements");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgInput, color: colors.text, boxSizing: "border-box" as const };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6, display: "block" };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, marginBottom: 24 }}>
        {isEditing ? "Modifier le paiement" : "Nouveau paiement — Cours du soir"}
      </h1>

      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle}>Élève *</label>
              <select style={inputStyle} value={form.eleveId} onChange={(e) => handleEleveChange(e.target.value)} required>
                <option value="">Sélectionner un élève...</option>
                {eleves.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom} — {e.classe}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Mois *</label>
                <input type="month" style={inputStyle} value={form.mois} onChange={(e) => setForm({ ...form, mois: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Date du paiement</label>
                <input type="date" style={inputStyle} value={form.datePaiement} onChange={(e) => setForm({ ...form, datePaiement: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Montant total (FCFA)</label>
                <input type="number" style={inputStyle} value={form.montantTotal} onChange={(e) => setForm({ ...form, montantTotal: Number(e.target.value) })} min={0} />
              </div>
              <div>
                <label style={labelStyle}>Montant payé (FCFA)</label>
                <input type="number" style={inputStyle} value={form.montantPaye} onChange={(e) => setForm({ ...form, montantPaye: Number(e.target.value) })} min={0} max={form.montantTotal} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Méthode de paiement</label>
              <select style={inputStyle} value={form.methode} onChange={(e) => setForm({ ...form, methode: e.target.value })}>
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="virement">Virement bancaire</option>
                <option value="cheque">Chèque</option>
              </select>
            </div>

            <div style={{ padding: "12px 16px", borderRadius: 8, background: statut === "paye" ? colors.successBg : statut === "partiel" ? colors.warningBg : colors.dangerBg }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: statut === "paye" ? colors.success : statut === "partiel" ? colors.warning : colors.danger }}>
                Statut : {statut === "paye" ? "Payé ✓" : statut === "partiel" ? `Partiel — Reste ${(form.montantTotal - form.montantPaye).toLocaleString("fr-FR")} FCFA` : "Impayé"}
              </p>
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes optionnelles..." />
            </div>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: colors.dangerBg, borderRadius: 8, marginTop: 16 }}>
              <p style={{ color: colors.danger, margin: 0, fontSize: 13 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: 14, background: saving ? colors.border : colors.primary, color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Enregistrement..." : isEditing ? "Enregistrer" : "Créer le paiement"}
            </button>
            <button type="button" onClick={() => navigate("/cours-du-soir/paiements")} style={{ flex: 1, padding: 14, background: colors.bgHover, color: colors.textMuted, border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
