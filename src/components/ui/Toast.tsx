import { createContext, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

const ToastContext = createContext<any>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 999 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background:
                t.type === "success"
                  ? "var(--success)"
                  : t.type === "error"
                  ? "var(--danger)"
                  : "#000",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 10,
              marginBottom: 10,
              boxShadow: "0 10px 30px rgba(0,0,0,.15)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
