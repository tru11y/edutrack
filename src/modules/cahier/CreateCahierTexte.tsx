import { useState } from "react";
import { createCahierEntry } from "./cahier.service";
import type { CahierEntry } from "./cahier.types";
import { exportCahierTextePDF } from "./cahier.pdf";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui";

interface Props {
  coursId: string;
  classe: string;
  elevesPresents: string[];
}

export default function CreateCahierTexte({
  coursId,
  classe,
  elevesPresents,
}: Props) {
  const { user } = useAuth();
  const toast = useToast();

  const [contenu, setContenu] = useState("");
  const [devoirs, setDevoirs] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user?.uid) { toast.error("Prof non identifié"); return; }
    if (!contenu.trim()) { toast.warning("Contenu obligatoire"); return; }

    const cahier: Omit<CahierEntry, "id" | "createdAt" | "updatedAt" | "isSigned" | "signedAt"> = {
      coursId,
      classe,
      profId: user.uid,
      profNom: user.email!,
      eleves: elevesPresents,
      date: new Date().toISOString().split("T")[0],
      contenu,
      devoirs,
    };

    try {
      setLoading(true);
      await createCahierEntry(cahier);

      await exportCahierTextePDF(cahier as CahierEntry);

      toast.success("Cahier de texte enregistré");
    } catch {
      toast.error("Erreur lors de l’enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 border rounded">
      <h3 className="font-semibold mb-3">📓 Cahier de texte</h3>

      <textarea
        placeholder="Contenu du cours"
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        className="w-full border p-2 rounded mb-2"
        rows={4}
      />

      <textarea
        placeholder="Devoirs à donner"
        value={devoirs}
        onChange={(e) => setDevoirs(e.target.value)}
        className="w-full border p-2 rounded mb-2"
        rows={3}
      />

      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Enregistrement…" : "💾 Enregistrer & PDF"}
      </button>
    </div>
  );
}
