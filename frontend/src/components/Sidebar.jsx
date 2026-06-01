import { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Users, ShoppingCart, Boxes } from "lucide-react";
import { gsap } from "gsap";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
];

export default function Sidebar({ open, onNavigate }) {
  const navRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo(
      navRef.current?.querySelectorAll(".nav-item") || [],
      { x: -16, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: "power3.out", delay: 0.1 }
    );
    gsap.fromTo(
      ".brand",
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
    );
  }, []);

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <button
        className="brand brand-action"
        type="button"
        onClick={() => {
          navigate("/");
          onNavigate();
        }}
        aria-label="Go to dashboard"
      >
        <div className="brand-mark">
          <Boxes size={22} />
        </div>
        <div>
          <div className="brand-name">Nexus</div>
          <div className="brand-sub">Ops Suite</div>
        </div>
      </button>

      <div className="nav-section">Manage</div>
      <nav ref={navRef}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <l.icon /> {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
