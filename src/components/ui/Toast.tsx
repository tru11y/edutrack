import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

interface ToastContextType {
  show: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const toastStyles: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)", icon: "✓" },
  error: { bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", icon: "✕" },
  warning: { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", icon: "!" },
  info: { bg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", icon: "i" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const success = useCallback((msg: string) => show(msg, "success"), [show]);
  const error = useCallback((msg: string) => show(msg, "error"), [show]);
  const warning = useCallback((msg: string) => show(msg, "warning"), [show]);
  const info = useCallback((msg: string) => show(msg, "info"), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: toastStyles[t.type].bg,
              color: "#fff",
              padding: "14px 20px",
              borderRadius: 12,
              boxShadow: "0 10px 40px rgba(0,0,0,.2)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 280,
              maxWidth: 400,
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <span style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}>
              {toastStyles[t.type].icon}
            </span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
