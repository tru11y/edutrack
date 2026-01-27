import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy, Component, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";

/* ========== ERROR BOUNDARY ========== */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center", background: "#fef2f2", minHeight: "100vh" }}>
          <div style={{ maxWidth: 500, margin: "0 auto", background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1e293b", margin: "0 0 8px" }}>Une erreur est survenue</h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px" }}>{this.state.error?.message || "Erreur inconnue"}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "12px 24px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ========== LOADING ========== */
function PageLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#f8fafc"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48,
          height: 48,
          border: "3px solid #e2e8f0",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px"
        }} />
        <p style={{ color: "#64748b", fontSize: 14 }}>Chargement...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

/* ========== LAZY IMPORTS ========== */
const AdminLayout = lazy(() => import("./Layout/AdminLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ElevesList = lazy(() => import("./pages/ElevesList"));
const EleveForm = lazy(() => import("./pages/EleveForm"));
const EleveDetail = lazy(() => import("./pages/EleveDetail"));
const MesEleves = lazy(() => import("./pages/MesEleves"));
const PresencesList = lazy(() => import("./pages/PresencesList"));
const PresenceAppel = lazy(() => import("./pages/PresenceAppel"));
const CahierList = lazy(() => import("./pages/CahierList"));
const CahierForm = lazy(() => import("./pages/CahierForm"));
const PaiementsList = lazy(() => import("./pages/PaiementsList"));
const PaiementForm = lazy(() => import("./pages/PaiementForm"));
const Stats = lazy(() => import("./pages/Stats"));
const Messages = lazy(() => import("./pages/Messages"));
const Profil = lazy(() => import("./pages/Profil"));
const Users = lazy(() => import("./pages/Users"));
const Classes = lazy(() => import("./pages/Classes"));
const Corbeille = lazy(() => import("./pages/Corbeille"));

/* ========== LOGIN ========== */
function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await login(email, password);
    } catch {
      setError("Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        padding: 40,
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <span style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>E</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>EDUTRACK</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Gestion scolaire simplifiee</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#6366f1"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#6366f1"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          {error && (
            <div style={{
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              marginBottom: 16
            }}>
              <p style={{ fontSize: 14, color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 24px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 14px -3px rgba(102, 126, 234, 0.5)"
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========== PROTECTED ROUTE ========== */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

/* ========== ADMIN ONLY ROUTE ========== */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user?.role === "prof") {
    return <Navigate to="/presences" replace />;
  }

  return <>{children}</>;
}

/* ========== PROF REDIRECT ========== */
function ProfRedirect() {
  const { user } = useAuth();

  if (user?.role === "prof") {
    return <Navigate to="/presences" replace />;
  }

  return <Dashboard />;
}

/* ========== APP ========== */
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<ProfRedirect />} />
                <Route path="eleves" element={<AdminRoute><ElevesList /></AdminRoute>} />
                <Route path="eleves/nouveau" element={<AdminRoute><EleveForm /></AdminRoute>} />
                <Route path="eleves/:id" element={<AdminRoute><EleveDetail /></AdminRoute>} />
                <Route path="eleves/:id/modifier" element={<AdminRoute><EleveForm /></AdminRoute>} />
                <Route path="classes" element={<AdminRoute><Classes /></AdminRoute>} />
                <Route path="mes-eleves" element={<MesEleves />} />
                <Route path="presences" element={<PresencesList />} />
                <Route path="presences/appel" element={<PresenceAppel />} />
                <Route path="cahier" element={<CahierList />} />
                <Route path="cahier/nouveau" element={<CahierForm />} />
                <Route path="cahier/:id/modifier" element={<CahierForm />} />
                <Route path="paiements" element={<AdminRoute><PaiementsList /></AdminRoute>} />
                <Route path="paiements/nouveau" element={<AdminRoute><PaiementForm /></AdminRoute>} />
                <Route path="paiements/:id/modifier" element={<AdminRoute><PaiementForm /></AdminRoute>} />
                <Route path="stats" element={<AdminRoute><Stats /></AdminRoute>} />
                <Route path="utilisateurs" element={<AdminRoute><Users /></AdminRoute>} />
                <Route path="messages" element={<Messages />} />
                <Route path="profil" element={<Profil />} />
                <Route path="corbeille" element={<AdminRoute><Corbeille /></AdminRoute>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
