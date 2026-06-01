import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Menu, Github, Activity } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import MotionLayer from "./components/MotionLayer.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Customers from "./pages/Customers.jsx";
import Orders from "./pages/Orders.jsx";

const TITLES = {
  "/": "Dashboard",
  "/products": "Products",
  "/customers": "Customers",
  "/orders": "Orders",
};

export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  const title = TITLES[pathname] || "Nexus";

  return (
    <div className="app-shell">
      <MotionLayer />
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div className={`scrim ${navOpen ? "show" : ""}`} onClick={() => setNavOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setNavOpen((v) => !v)} aria-label="Menu">
            <Menu size={18} />
          </button>
          <div>
            <h1>{title}</h1>
            <div className="crumb">Nexus / {title}</div>
          </div>
          <div className="topbar-spacer" />
          <button
            className="badge badge-ok live-pill"
            title="Refresh app data"
            aria-label="Refresh app data"
            onClick={() => window.location.reload()}
          >
            <Activity size={13} style={{ marginRight: 2 }} /> Live
          </button>
          <a
            className="icon-btn"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            title="Source"
          >
            <Github size={18} />
          </a>
        </header>

        <main className="content">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/orders" element={<Orders />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
