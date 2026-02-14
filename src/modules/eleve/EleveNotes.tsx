import { useAuth } from "../../context/AuthContext";
import NotesList from "../notes/NotesList";

export default function EleveNotes() {
  const { user } = useAuth();
  if (!user?.eleveId) return <div>Erreur: pas d'eleve associe.</div>;
  return <NotesList eleveId={user.eleveId} />;
}
