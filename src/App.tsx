import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";

/* ========== ADMIN ========== */
import AdminLayout from "./Layout/AdminLayout";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminCahierList from "./modules/cahier/AdminCahierList";

import ElevesList from "./modules/eleves/ElevesList";
import CreateEleve from "./modules/eleves/CreateEleve";
import EleveProfile from "./modules/eleves/EleveProfile";

import ProfesseursList from "./modules/professeurs/ProfesseursList";

import CoursList from "./modules/cours/CoursList";
import CreateCours from "./modules/cours/CreateCours";
import CoursDetail from "./modules/cours/CoursDetail";

import PaiementsList from "./modules/paiements/PaiementsList";
import PaiementEleve from "./modules/paiements/paiementEleve";

/* ========== PROFESSEUR ========== */
import ProfesseurLayout from "./modules/professeurs/ProfesseurLayout";
import ProfesseurDashboard from "./modules/professeurs/ProfesseurDashboard";
import ProfCoursDetail from "./modules/professeurs/ProfCoursDetail";

/* ========== ELEVE ========== */
import EleveLayout from "./Layout/EleveLayout";
import EleveDashboard from "./modules/eleves/EleveDashboard";
import EleveEmploiDuTemps from "./modules/eleves/EleveEmploiDuTemps";
import ElevePresences from "./modules/eleves/ElevePresences";
import ElevePaiements from "./modules/eleves/ElevePaiements";

/* ========== LOGIN ========== */

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
    } catch {
      setError("Identifiants invalides");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">EDUTRACK – Connexion</h1>

        <input
          className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full px-3 py-2 border border-gray-300 rounded mb-6"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded font-semibold disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
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

            {/* Cahier */}
            <Route path="cahier" element={<AdminCahierList />} />
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
