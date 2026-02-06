import { useEffect, useState, useCallback } from "react";
import { getAllUsers } from "./user.service";
import { toggleUserStatusSecure } from "../../../services/cloudFunctions";
import { useTheme } from "../../../context/ThemeContext";
import type { UserRole } from "../../../types/User";

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export default function UsersList() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<UserListItem[]>([]);

  const load = useCallback(async () => {
    const data = await getAllUsers();
    setUsers(data as UserListItem[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4" style={{ color: colors.text }}>Utilisateurs</h1>

      <table className="w-full rounded shadow" style={{ background: colors.bgCard }}>
        <thead>
          <tr className="text-left" style={{ background: colors.bgSecondary }}>
            <th className="p-2" style={{ color: colors.text }}>Nom</th>
            <th className="p-2" style={{ color: colors.text }}>Email</th>
            <th className="p-2" style={{ color: colors.text }}>Rôle</th>
            <th className="p-2" style={{ color: colors.text }}>Statut</th>
            <th className="p-2" style={{ color: colors.text }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderTop: `1px solid ${colors.border}` }}>
              <td className="p-2" style={{ color: colors.text }}>{u.name}</td>
              <td className="p-2" style={{ color: colors.textMuted }}>{u.email}</td>
              <td className="p-2" style={{ color: colors.text }}>{u.role}</td>
              <td className="p-2">
                <span style={{
                  color: u.isActive ? colors.success : colors.danger
                }}>
                  {u.isActive ? "Actif" : "Inactif"}
                </span>
              </td>
              <td className="p-2">
                <button
                  onClick={async () => {
                    await toggleUserStatusSecure({ userId: u.id, isActive: !u.isActive });
                    load();
                  }}
                  style={{ color: colors.primary }}
                >
                  Basculer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
