import { useAuth } from "../context/AuthContext";

export default function CompteSuspendu() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">
          🚫 Compte suspendu
        </h1>

        <p className="text-gray-700">
          Votre accès a été suspendu pour non paiement.
        </p>

        <p className="text-gray-500 text-sm">
          Élève : {user?.email}
        </p>

        <p className="text-gray-500 text-sm">
          Veuillez régulariser votre situation auprès de l’administration.
        </p>

        <button
          onClick={logout}
          className="mt-4 bg-black text-white px-4 py-2 rounded"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
