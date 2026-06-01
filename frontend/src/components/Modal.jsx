import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { gsap } from "gsap";

export default function Modal({ title, onClose, children, footer, wide }) {
  const overlay = useRef(null);
  const box = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(overlay.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
      gsap.fromTo(
        box.current,
        { y: 26, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.42, ease: "back.out(1.5)" }
      );
    });
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      ctx.revert();
    };
  }, [onClose]);

  return (
    <div className="overlay" ref={overlay} onMouseDown={(e) => e.target === overlay.current && onClose()}>
      <div className={`modal ${wide ? "wide" : ""}`} ref={box}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
