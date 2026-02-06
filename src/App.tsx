import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ToastProvider } from "./components/ui/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";

const AdminLayout = lazy(() => import("./Layout/AdminLayout"));
const LoginPage = lazy(() => import("./modules/auth/LoginPage"));
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
const Compta = lazy(() => import("./pages/Compta"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin" && user?.role !== "gestionnaire") {
    return <Navigate to="/presences" replace />;
  }
  return <>{children}</>;
}

function ProfRedirect() {
  const { user } = useAuth();
  if (user?.role !== "admin" && user?.role !== "gestionnaire") {
    return <Navigate to="/presences" replace />;
  }
  return <Dashboard />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
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
                      <Route path="comptabilite" element={<AdminRoute><Compta /></AdminRoute>} />
                      <Route path="corbeille" element={<AdminRoute><Corbeille /></AdminRoute>} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
