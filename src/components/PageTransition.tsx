import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [transitionStage, setTransitionStage] = useState<"in" | "out">("in");
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      setTransitionStage("out");
      const timer = setTimeout(() => {
        prevPathRef.current = location.pathname;
        setTransitionStage("in");
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <>
      <div
        style={{
          animation: transitionStage === "in" ? "pageFadeIn 0.2s ease-out" : "pageFadeOut 0.15s ease-in",
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pageFadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-8px); }
        }
      `}</style>
    </>
  );
}
