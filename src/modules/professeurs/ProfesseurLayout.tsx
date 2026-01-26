import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProfesseurLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f7" }}>
      {/* Sidebar */}
      <aside style={{
        width: 260,
        background: "#fff",
        borderRight: "1px solid #e5e5e5",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px"
      }}>
        <div style={{ padding: "0 12px", marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1d1d1f" }}>EDUTRACK</h1>
          <span style={{
            display: "inline-block",
            marginTop: 8,
            padding: "4px 10px",
            background: "#5856d6",
            color: "#fff",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500
          }}>
            Professeur
          </span>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <NavLink
            to="/prof"
            end
            style={({ isActive }) => ({
              display: "block",
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? "#fff" : "#1d1d1f",
              background: isActive ? "#1d1d1f" : "transparent",
              textDecoration: "none"
            })}
          >
            Mes cours
          </NavLink>
        </nav>

        <div style={{
          padding: 16,
          background: "#f5f5f7",
          borderRadius: 12,
          marginTop: 16
        }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#1d1d1f", marginBottom: 4 }}>
            {user?.email?.split("@")[0]}
          </div>
          <div style={{ fontSize: 12, color: "#86868b", marginBottom: 12 }}>
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: "#1d1d1f",
              cursor: "pointer"
            }}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
