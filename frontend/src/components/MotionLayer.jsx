import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";

const hoverSelector = [
  ".btn:not(:disabled)",
  ".icon-btn",
  ".act:not(:disabled)",
  ".nav-item",
  ".clickable-card",
  ".mini-row.interactive",
  ".search-action",
  ".contact-link",
  ".live-pill",
].join(", ");

const revealSelector = [
  ".page-head",
  ".panel",
  ".stat-card",
  ".mini-row",
  ".modal",
].join(", ");

export default function MotionLayer() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return undefined;

    const cleanups = new WeakMap();
    const bind = (el) => {
      if (cleanups.has(el)) return;
      const enter = () => {
        gsap.to(el, {
          y: el.classList.contains("nav-item") ? 0 : -2,
          x: el.classList.contains("nav-item") ? 3 : 0,
          scale: el.classList.contains("clickable-card") ? 1.015 : 1.02,
          duration: 0.2,
          ease: "power2.out",
        });
      };
      const leave = () => {
        gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.24, ease: "power2.out" });
      };
      const down = () => {
        gsap.to(el, { scale: 0.96, duration: 0.08, ease: "power2.out" });
      };
      const up = () => {
        gsap.to(el, { scale: 1, duration: 0.16, ease: "back.out(2)" });
      };

      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", leave);

      cleanups.set(el, () => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
        el.removeEventListener("pointerdown", down);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", leave);
        gsap.killTweensOf(el);
      });
    };

    const bindAll = () => Array.from(document.querySelectorAll(hoverSelector)).forEach(bind);
    const revealAll = () => {
      Array.from(document.querySelectorAll(revealSelector)).forEach((el, index) => {
        if (el.dataset.revealed === "true") return;
        el.dataset.revealed = "true";

        gsap.fromTo(
          el,
          { y: el.classList.contains("modal") ? 22 : 16, opacity: 0, scale: el.classList.contains("stat-card") ? 0.98 : 1 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.42,
            delay: Math.min(index * 0.025, 0.18),
            ease: "power3.out",
            clearProps: "transform,opacity",
          }
        );
      });
    };

    bindAll();
    revealAll();

    const observer = new MutationObserver(bindAll);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      Array.from(document.querySelectorAll(hoverSelector)).forEach((el) => cleanups.get(el)?.());
    };
  }, [pathname]);

  return null;
}
