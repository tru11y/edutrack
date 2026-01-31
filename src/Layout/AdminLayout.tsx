import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  roles: ("admin" | "prof")[];
}

const navItems: NavItem[] = [
  { to: "/", label: "Tableau de bord", icon: "dashboard", end: true, roles: ["admin"] },
  { to: "/eleves", label: "Eleves", icon: "users", roles: ["admin"] },
  { to: "/mes-eleves", label: "Mes eleves", icon: "users", roles: ["prof"] },
  { to: "/presences", label: "Presences", icon: "check", roles: ["admin", "prof"] },
  { to: "/cahier", label: "Cahier de texte", icon: "book", roles: ["admin", "prof"] },
  { to: "/paiements", label: "Paiements", icon: "card", roles: ["admin"] },
  { to: "/stats", label: "Statistiques", icon: "chart", roles: ["admin"] },
  { to: "/utilisateurs", label: "Utilisateurs", icon: "settings", roles: ["admin"] },
  { to: "/messages", label: "Messages", icon: "message", roles: ["admin", "prof"] },
  { to: "/corbeille", label: "Corbeille", icon: "trash", roles: ["admin"] },
];

const icons: Record<string, React.ReactNode> = {
  dashboard: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14 17.5V16C14 14.3431 12.6569 13 11 13H5C3.34315 13 2 14.3431 2 16V17.5M18 17.5V16C18 14.79 17.21 13.76 16.12 13.42M12.62 2.58C13.7 2.93 14.49 3.96 14.49 5.16C14.49 6.36 13.7 7.39 12.62 7.74M11 5C11 6.65685 9.65685 8 8 8C6.34315 8 5 6.65685 5 5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.67 5L7.5 14.17L3.33 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  book: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 15.5V4.5C2 3.67 2.67 3 3.5 3H16.5C17.33 3 18 3.67 18 4.5V15.5C18 16.33 17.33 17 16.5 17H3.5C2.67 17 2 16.33 2 15.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M10 3V17M2 8H18" stroke="currentColor" strokeWidth="1.5"/></svg>,
  card: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8H18" stroke="currentColor" strokeWidth="1.5"/></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 16V9M7 16V5M12 16V11M17 16V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M10 1V3M10 17V19M1 10H3M17 10H19M3.93 3.93L5.34 5.34M14.66 14.66L16.07 16.07M3.93 16.07L5.34 14.66M14.66 5.34L16.07 3.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  message: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M18 10C18 14.42 14.42 18 10 18C8.57 18 7.22 17.64 6.04 17L2 18L3 14C2.36 12.81 2 11.45 2 10C2 5.58 5.58 2 10 2C14.42 2 18 5.58 18 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2.5 5H17.5M7.5 5V3.33C7.5 2.6 8.1 2 8.83 2H11.17C11.9 2 12.5 2.6 12.5 3.33V5M8.33 9.17V14.17M11.67 9.17V14.17M4.17 5L5 16.67C5 17.4 5.6 18 6.33 18H13.67C14.4 18 15 17.4 15 16.67L15.83 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  menu: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  close: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
};

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profMode, setProfMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const actualRole = user?.role === "admin" ? "admin" : "prof";
  const userRole = (actualRole === "admin" && profMode) ? "prof" : actualRole;
  const isProf = userRole === "prof";
  const canSwitchMode = actualRole === "admin";

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole as "admin" | "prof"));

  const sidebarWidth = 260;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Mobile Header */}
      {isMobile && (
        <header style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}
              aria-label="Ouvrir menu"
            >
              {icons.menu}
            </button>
            <div style={{
              width: 32,
              height: 32,
              background: isProf ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>E</span>
            </div>
            <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 16 }}>EDUTRACK</span>
          </div>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: isProf ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13
          }}>
            {user?.email?.[0]?.toUpperCase() || "A"}
          </div>
        </header>
      )}

      {/* Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 55,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        background: "#fff",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: isMobile ? (sidebarOpen ? 0 : -sidebarWidth) : 0,
        bottom: 0,
        zIndex: 60,
        transition: "left 0.3s ease-in-out",
        boxShadow: isMobile && sidebarOpen ? "4px 0 20px rgba(0,0,0,0.1)" : "none",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42,
                height: 42,
                background: isProf ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>E</span>
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>EDUTRACK</h1>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{isProf ? "Espace Professeur" : "Gestion scolaire"}</p>
              </div>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}
                aria-label="Fermer menu"
              >
                {icons.close}
              </button>
            )}
          </div>
          {canSwitchMode && (
            <button
              onClick={() => setProfMode(!profMode)}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "10px 14px",
                background: profMode ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M2 8l3-3M2 8l3 3M14 8l-3-3M14 8l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {profMode ? "Mode Admin" : "Mode Prof"}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "20px 12px", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  color: isActive ? (isProf ? "#10b981" : "#6366f1") : "#64748b",
                  background: isActive ? (isProf ? "#ecfdf5" : "#eef2ff") : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s"
                })}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  {icons[item.icon]}
                </span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User */}
        <div style={{ padding: 16, borderTop: "1px solid #e2e8f0" }}>
          <div style={{ padding: 16, background: "#f8fafc", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: isProf ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14
              }}>
                {user?.email?.[0]?.toUpperCase() || "A"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#1e293b",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {user?.email?.split("@")[0] || "Utilisateur"}
                </p>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                  {isProf ? "Professeur" : "Administrateur"}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <NavLink
                to="/profil"
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#64748b",
                  textDecoration: "none",
                  textAlign: "center"
                }}
              >
                Mon profil
              </NavLink>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#dc2626",
                  cursor: "pointer"
                }}
              >
                Deconnexion
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : sidebarWidth,
        marginTop: isMobile ? 60 : 0,
        minHeight: isMobile ? "calc(100vh - 60px)" : "100vh",
        transition: "margin-left 0.3s ease-in-out"
      }}>
        <div style={{ padding: isMobile ? 16 : 32, maxWidth: 1400, margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
