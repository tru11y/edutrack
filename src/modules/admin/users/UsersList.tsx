import { useEffect, useState } from "react";
import { getAllUsers, toggleUserStatus } from "./user.service";

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    const data = await getAllUsers();
    setUsers(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">👥 Utilisateurs</h1>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left bg-gray-200">
            <th className="p-2">Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                {u.isActive ? "🟢 Actif" : "🔴 Inactif"}
              </td>
              <td>
                <button
                  onClick={async () => {
                    await toggleUserStatus(u.id, !u.isActive);
                    load();
                  }}
                  className="text-blue-600"
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
