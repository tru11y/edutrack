// ===============================
// EDUTRACK – UX DASHBOARDS (Apple School style)
// Clean, pro, responsive – Admin / Prof / Élève
// Tailwind required
// ===============================

/* =====================================================
   SHARED UI COMPONENTS
===================================================== */

import { ReactNode } from "react";

export function Card({ title, value, icon, color }: { title: string; value: ReactNode; icon?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      {icon && (
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl ${color || "bg-black"}`}>
          {icon}
        </div>
      )}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
}

/* =====================================================
   ADMIN DASHBOARD – CLEAN
===================================================== */

export function AdminDashboardUI() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">👋 Bonjour, Admin</h1>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Élèves" value={120} icon="🎓" color="bg-blue-600" />
        <Card title="Présences" value="85%" icon="📊" color="bg-green-600" />
        <Card title="Paiements en attente" value={8} icon="💰" color="bg-orange-500" />
        <Card title="Sanctions" value={5} icon="⚠️" color="bg-red-600" />
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Paiements en retard">
          <p>Jean Durand — <span className="text-red-600">50€ en retard</span></p>
          <p>Marie Lefevre — <span className="text-orange-600">30€ en retard</span></p>
        </Section>

        <Section title="Sanctions récentes">
          <p>Paul Martin — Exclusion temporaire</p>
          <p>Emma Dubois — Avertissement</p>
        </Section>
      </div>
    </div>
  );
}

/* =====================================================
   PROF DASHBOARD – FLUIDE
===================================================== */

export function ProfDashboardUI() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">👋 Bonjour, Professeur</h1>

      <input
        placeholder="🔍 Rechercher un élève"
        className="w-full border rounded-xl p-3"
      />

      <Section title="Élèves à risque">
        <div className="space-y-2">
          <p>Jean Durand — <span className="text-red-600">5 absences</span></p>
          <p>Marie Lefevre — <span className="text-orange-600">3 absences</span></p>
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Présents aujourd’hui" value={102} icon="✅" color="bg-green-600" />
        <Card title="Absents" value={12} icon="❌" color="bg-red-600" />
        <Card title="Retards" value={6} icon="⏰" color="bg-orange-500" />
      </div>

      <Section title="Notes du jour">
        <p>Maths — Contrôle sur les fractions</p>
        <p>Histoire — Révision Renaissance</p>
      </Section>
    </div>
  );
}

/* =====================================================
   ÉLÈVE DASHBOARD – CLAIR
===================================================== */

export function EleveDashboardUI() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">👋 Bonjour, Élève</h1>

      <Section title="Cours du jour">
        <div className="space-y-2">
          <p>📘 Algèbre — 09h00</p>
          <p>📗 Anglais — 10h00</p>
          <p>📕 Histoire — 11h00</p>
        </div>
      </Section>

      <Section title="Notifications">
        <p className="text-orange-600">⚠️ 1 devoir à rendre demain</p>
        <p className="text-green-600">💰 Paiement validé</p>
      </Section>
    </div>
  );
}

/* =====================================================
   MOBILE NAV BAR (OPTIONNEL)
===================================================== */

export function MobileNav({ role }: { role: "admin" | "prof" | "eleve" }) {
  const links = {
    admin: ["Dashboard", "Élèves", "Profs", "Paiements"],
    prof: ["Dashboard", "Cours", "Présences"],
    eleve: ["Dashboard", "Cours", "Paiements"],
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3">
      {links[role].map((l) => (
        <span key={l} className="text-sm font-medium text-gray-700">{l}</span>
      ))}
    </div>
  );
}
