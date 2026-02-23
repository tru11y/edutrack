import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { SchoolProvider } from "./context/SchoolContext";
import { TenantProvider } from "./context/TenantContext";
import { ToastProvider } from "./components/ui/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";
import MessageNotificationContainer from "./components/MessageNotification";
import SkipToContent from "./components/SkipToContent";
import OfflineBanner from "./components/OfflineBanner";
import { retryQueue } from "./services/cloudFunctions";
import { requestPushPermission, saveFCMToken, onForegroundMessage } from "./services/pushNotifications";
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
const ElevePortalDashboard = lazy(() => import("./modules/eleve/ElevePortalDashboard"));
const EleveNotes = lazy(() => import("./modules/eleve/EleveNotes"));
const ElevePortalPresences = lazy(() => import("./modules/eleve/ElevePortalPresences"));
const ElevePortalEmploiDuTemps = lazy(() => import("./modules/eleve/ElevePortalEmploiDuTemps"));
const ParentNotes = lazy(() => import("./modules/parent/ParentNotes"));
const ParentEmploiDuTemps = lazy(() => import("./modules/parent/ParentEmploiDuTemps"));
const Discipline = lazy(() => import("./pages/Discipline"));
const Matieres = lazy(() => import("./pages/Matieres"));
const ImportEleves = lazy(() => import("./pages/ImportEleves"));
const ProfDashboard = lazy(() => import("./pages/ProfDashboard"));
const ParentDashboard = lazy(() => import("./modules/parent/ParentDashboard"));
const ParentPresences = lazy(() => import("./modules/parent/ParentPresences"));
const ParentCahier = lazy(() => import("./modules/parent/ParentCahier"));
const ParentPaiement = lazy(() => import("./modules/parent/ParentPaiement"));
const Archives = lazy(() => import("./pages/Archives"));
const PermissionManagement = lazy(() => import("./pages/PermissionManagement"));
const SchoolSettings = lazy(() => import("./pages/SchoolSettings"));


function OnlineQueueRetry() {
  useEffect(() => {
    const handleOnline = () => {
      retryQueue().catch(() => {});
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
  return null;
}

function PushNotificationInit() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const pushEnabled = localStorage.getItem("edutrack_push_enabled");
    if (pushEnabled === "false") return;
    requestPushPermission().then((granted) => {
      if (granted) saveFCMToken();
    });
    const unsub = onForegroundMessage(() => {
      // Toast handled by NotificationCenter
    });
    return unsub;
  }, [user]);
  return null;
}

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
            <SchoolProvider>
            <TenantProvider>
            <ToastProvider>
              <BrowserRouter>
                <OnboardingProvider>
                <SkipToContent />
                <OfflineBanner />
                <OnlineQueueRetry />
                <PushNotificationInit />
                <MessageNotificationContainer />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Main app routes */}
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
                      <Route path="discipline" element={<Discipline />} />
                      <Route path="matieres" element={<AdminRoute><Matieres /></AdminRoute>} />
                      <Route path="import-eleves" element={<AdminRoute><ImportEleves /></AdminRoute>} />
                      <Route path="corbeille" element={<AdminRoute><Corbeille /></AdminRoute>} />
                      <Route path="archives" element={<AdminRoute><Archives /></AdminRoute>} />
                      <Route path="admin/permissions" element={<AdminRoute><PermissionManagement /></AdminRoute>} />
                      <Route path="parametres" element={<AdminRoute><SchoolSettings /></AdminRoute>} />
                      {/* Student Portal */}
                      <Route path="eleve" element={<ElevePortalDashboard />} />
                      <Route path="eleve/notes" element={<EleveNotes />} />
                      <Route path="eleve/presences" element={<ElevePortalPresences />} />
                      <Route path="eleve/emploi-du-temps" element={<ElevePortalEmploiDuTemps />} />
                      {/* Parent Portal */}
                      <Route path="parent/dashboard" element={<ParentDashboard />} />
                      <Route path="parent/notes" element={<ParentNotes />} />
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
            </TenantProvider>
            </SchoolProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
