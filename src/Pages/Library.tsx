import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { callFunction } from "../services/cloudFunctions";

interface Book {
  id: string;
  titre: string;
  auteur: string;
  isbn: string;
  quantite: number;
  disponible: number;
  categorie: string;
}

export default function Library() {
  const { colors } = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState("");
  const [auteur, setAuteur] = useState("");
  const [isbn, setIsbn] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [categorie, setCategorie] = useState("");
  const [saving, setSaving] = useState(false);

  const loadBooks = useCallback(async () => {
    try {
      const res = await callFunction<{ books: Book[] }>("listBooks", {});
      setBooks(res.books || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await callFunction("createBook", { titre, auteur, isbn, quantite: parseInt(quantite) || 1, categorie });
      setTitre(""); setAuteur(""); setIsbn(""); setQuantite("1"); setCategorie("");
      setShowForm(false);
      loadBooks();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8,
    fontSize: 14, outline: "none", boxSizing: "border-box" as const, background: colors.cardBg, color: colors.text,
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>Bibliotheque</h1>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
          cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>
          {showForm ? "Annuler" : "+ Nouveau livre"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: colors.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre *" style={{ ...inputStyle, flex: 2 }} />
              <input value={auteur} onChange={(e) => setAuteur(e.target.value)} placeholder="Auteur *" style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <input value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="ISBN" style={{ ...inputStyle, flex: 1 }} />
              <input type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} placeholder="Quantite" min="1" style={{ ...inputStyle, flex: 1 }} />
              <input value={categorie} onChange={(e) => setCategorie(e.target.value)} placeholder="Categorie" style={{ ...inputStyle, flex: 1 }} />
            </div>
            <button onClick={handleCreate} disabled={saving || !titre.trim() || !auteur.trim()} style={{
              padding: "10px", background: titre.trim() && auteur.trim() ? "#6366f1" : "#d1d5db", color: "#fff",
              border: "none", borderRadius: 8, cursor: titre.trim() && auteur.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 14,
            }}>
              {saving ? "Enregistrement..." : "Ajouter le livre"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: colors.textSecondary }}>Chargement...</p>
      ) : books.length === 0 ? (
        <p style={{ color: colors.textSecondary }}>Aucun livre dans la bibliotheque.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {books.map((book) => (
            <div key={book.id} style={{ background: colors.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: "0 0 4px" }}>{book.titre}</h3>
              <p style={{ fontSize: 13, color: colors.textSecondary, margin: "0 0 8px" }}>{book.auteur}</p>
              {book.categorie && <span style={{ padding: "2px 8px", background: "#e0e7ff", color: "#4338ca", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{book.categorie}</span>}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 13, color: colors.textSecondary }}>
                <span>Disponible: {book.disponible}/{book.quantite}</span>
                {book.isbn && <span>ISBN: {book.isbn}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
