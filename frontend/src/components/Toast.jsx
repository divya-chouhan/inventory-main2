import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { gsap } from "gsap";

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "ok") => {
    const id = ++idSeq;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const value = {
    success: (m) => push(m, "ok"),
    error: (m) => push(m, "err"),
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ message, type }) {
  const ref = useRef(null);
  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { x: 40, opacity: 0, scale: 0.95 },
      { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }
    );
  }, []);
  return (
    <div className={`toast ${type}`} ref={ref}>
      {type === "ok" ? <CheckCircle2 /> : <AlertCircle />}
      <span>{message}</span>
    </div>
  );
}
