import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";

/* ========== ADMIN ========== */
import AdminLayout from "./layout/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";

import ElevesList from "./modules/eleves/ElevesList";
import CreateEleve from "./modules/eleves/CreateEleve";
import EleveProfile from "./modules/eleves/EleveProfile";

import ProfesseursList from "./modules/professeurs/ProfesseursList";

import CoursList from "./modules/cours/CoursList";
import CreateCours from "./modules/cours/CreateCours";
import CoursDetail from "./modules/cours/CoursDetail";

import PaiementsList from "./modules/paiements/PaiementsList";
import PaiementEleve from "./modules/paiements/PaiementEleve";

/* ========== PROFESSEUR ========== */
import ProfesseurLayout from "./modules/professeurs/ProfesseurLayout";
import ProfesseurDashboard from "./modules/professeurs/ProfesseurDashboard";
import ProfCoursDetail from "./modules/professeurs/ProfCoursDetail";

/* ========== ELEVE ========== */
import EleveLayout from "./layout/EleveLayout";
import EleveDashboard from "./modules/eleves/EleveDashboard";
import EleveEmploiDuTemps from "./modules/eleves/EleveEmploiDuTemps";
import ElevePresences from "./modules/eleves/ElevePresences";
import ElevePaiements from "./modules/eleves/ElevePaiements";

/* =========================
   LOGIN
========================= */

function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔁 REDIRECTION PROPRE APRÈS LOGIN (ROLE-BASED)
  useEffect(() => {
    if (!user) return;

    if (user.role === "admin") navigate("/admin", { replace: true });
    if (user.role === "prof") navigate("/prof", { replace: true });
    if (user.role === "eleve") navigate("/eleve", { replace: true });
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      // ❌ PAS DE navigate ICI
    } catch {
      setError("Identifiants invalides");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: "0 auto" }}>
      <h1>EDUTRACK – Connexion</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Connexion..." : "Se connecter"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

/* =========================
   APP ROOT
========================= */

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* ================= ADMIN ================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />

            {/* Élèves */}
            <Route path="eleves" element={<ElevesList />} />
            <Route path="eleves/create" element={<CreateEleve />} />
            <Route path="eleves/:id" element={<EleveProfile />} />
            <Route path="eleves/:id/paiements" element={<PaiementEleve />} />

            {/* Professeurs */}
            <Route path="professeurs" element={<ProfesseursList />} />

            {/* Cours */}
            <Route path="cours" element={<CoursList />} />
            <Route path="cours/create" element={<CreateCours />} />
            <Route path="cours/:id" element={<CoursDetail />} />

            {/* Paiements */}
            <Route path="paiements" element={<PaiementsList />} />
          </Route>

          {/* ================= PROFESSEUR ================= */}
          <Route
            path="/prof"
            element={
              <ProtectedRoute roles={["prof"]}>
                <ProfesseurLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProfesseurDashboard />} />
            <Route path="cours/:id" element={<ProfCoursDetail />} />
          </Route>

          {/* ================= ELEVE ================= */}
          <Route
            path="/eleve"
            element={
              <ProtectedRoute roles={["eleve"]}>
                <EleveLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EleveDashboard />} />
            <Route path="emploi-du-temps" element={<EleveEmploiDuTemps />} />
            <Route path="presences" element={<ElevePresences />} />
            <Route path="paiements" element={<ElevePaiements />} />
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<div>Page introuvable</div>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
