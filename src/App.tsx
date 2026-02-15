import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ToastProvider } from "./components/ui/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";
import MessageNotificationContainer from "./components/MessageNotification";
import { OnboardingProvider } from "./components/onboarding/OnboardingProvider";

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
const EmploiDuTemps = lazy(() => import("./pages/EmploiDuTemps"));
const Evaluations = lazy(() => import("./pages/Evaluations"));
const EvaluationFormPage = lazy(() => import("./pages/EvaluationFormPage"));
const NoteSaisiePage = lazy(() => import("./pages/NoteSaisiePage"));
const Bulletins = lazy(() => import("./pages/Bulletins"));
const ElevePortalDashboard = lazy(() => import("./modules/eleve/ElevePortalDashboard"));
const EleveNotes = lazy(() => import("./modules/eleve/EleveNotes"));
const ElevePortalPresences = lazy(() => import("./modules/eleve/ElevePortalPresences"));
const ElevePortalEmploiDuTemps = lazy(() => import("./modules/eleve/ElevePortalEmploiDuTemps"));
const EleveBulletin = lazy(() => import("./modules/eleve/EleveBulletin"));
const ParentNotes = lazy(() => import("./modules/parent/ParentNotes"));
const ParentBulletins = lazy(() => import("./modules/parent/ParentBulletins"));
const ParentEmploiDuTemps = lazy(() => import("./modules/parent/ParentEmploiDuTemps"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationConfigPage = lazy(() => import("./pages/NotificationConfigPage"));
const Discipline = lazy(() => import("./pages/Discipline"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Matieres = lazy(() => import("./pages/Matieres"));
const ImportEleves = lazy(() => import("./pages/ImportEleves"));
const ProfDashboard = lazy(() => import("./pages/ProfDashboard"));
const ParentDashboard = lazy(() => import("./modules/parent/ParentDashboard"));
const ParentPresences = lazy(() => import("./modules/parent/ParentPresences"));
const ParentCahier = lazy(() => import("./modules/parent/ParentCahier"));
const ParentPaiement = lazy(() => import("./modules/parent/ParentPaiement"));
const SchoolSettings = lazy(() => import("./pages/SchoolSettings"));

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
  if (user?.role === "eleve") {
    return <Navigate to="/eleve" replace />;
  }
  if (user?.role === "parent") {
    return <Navigate to="/parent/dashboard" replace />;
  }
  if (user?.role !== "admin" && user?.role !== "gestionnaire") {
    return <ProfDashboard />;
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
                <OnboardingProvider>
                <MessageNotificationContainer />
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
                      <Route path="emploi-du-temps" element={<AdminRoute><EmploiDuTemps /></AdminRoute>} />
                      <Route path="evaluations" element={<Evaluations />} />
                      <Route path="evaluations/nouvelle" element={<EvaluationFormPage />} />
                      <Route path="evaluations/:id/modifier" element={<EvaluationFormPage />} />
                      <Route path="evaluations/:id/notes" element={<NoteSaisiePage />} />
                      <Route path="bulletins" element={<AdminRoute><Bulletins /></AdminRoute>} />
                      <Route path="notifications" element={<Notifications />} />
                      <Route path="notifications/config" element={<AdminRoute><NotificationConfigPage /></AdminRoute>} />
                      <Route path="discipline" element={<Discipline />} />
                      <Route path="audit" element={<AdminRoute><AuditLogs /></AdminRoute>} />
                      <Route path="matieres" element={<AdminRoute><Matieres /></AdminRoute>} />
                      <Route path="import-eleves" element={<AdminRoute><ImportEleves /></AdminRoute>} />
                      <Route path="parametres" element={<AdminRoute><SchoolSettings /></AdminRoute>} />
                      <Route path="corbeille" element={<AdminRoute><Corbeille /></AdminRoute>} />
                      {/* Student Portal */}
                      <Route path="eleve" element={<ElevePortalDashboard />} />
                      <Route path="eleve/notes" element={<EleveNotes />} />
                      <Route path="eleve/presences" element={<ElevePortalPresences />} />
                      <Route path="eleve/emploi-du-temps" element={<ElevePortalEmploiDuTemps />} />
                      <Route path="eleve/bulletins" element={<EleveBulletin />} />
                      {/* Parent Portal */}
                      <Route path="parent/dashboard" element={<ParentDashboard />} />
                      <Route path="parent/notes" element={<ParentNotes />} />
                      <Route path="parent/bulletins" element={<ParentBulletins />} />
                      <Route path="parent/emploi-du-temps" element={<ParentEmploiDuTemps />} />
                      <Route path="parent/presences" element={<ParentPresences />} />
                      <Route path="parent/cahier" element={<ParentCahier />} />
                      <Route path="parent/paiements" element={<ParentPaiement />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
                </OnboardingProvider>
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
