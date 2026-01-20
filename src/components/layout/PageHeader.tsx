import { ReactNode } from "react";

export default function Page({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 px-8 py-6">
      {children}
    </div>
  );
}
