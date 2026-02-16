import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<"in" | "out">("in");

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage("out");
    }
  }, [children, displayChildren]);

  return (
    <>
      <div
        key={location.pathname}
        style={{
          animation: transitionStage === "in" ? "pageFadeIn 0.2s ease-out" : "pageFadeOut 0.15s ease-in",
        }}
        onAnimationEnd={() => {
          if (transitionStage === "out") {
            setDisplayChildren(children);
            setTransitionStage("in");
          }
        }}
      >
        {displayChildren}
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
