import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, Users, ShoppingCart, DollarSign, TrendingDown,
  XCircle, ArrowUpRight,
} from "lucide-react";
import { gsap } from "gsap";
import { Dashboard as DashApi, Orders as OrdersApi, Products as ProductsApi } from "../api/client";
import { Spinner } from "../components/Misc.jsx";

const fmt = (n) => "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const grid = useRef(null);

  useEffect(() => {
    Promise.all([DashApi.stats(), OrdersApi.list(), ProductsApi.list()])
      .then(([s, o, p]) => {
        setStats(s);
        setOrders(o.slice(0, 6));
        setProducts(p);
        setError(null);
      })
      .catch(() =>
        setError(
          "Couldn't reach the API. Make sure the backend is running on http://localhost:8000."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && grid.current) {
      gsap.fromTo(
        grid.current.querySelectorAll(".stat-card"),
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power3.out" }
      );
      gsap.fromTo(
        ".panel",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: "power3.out", delay: 0.25 }
      );
    }
  }, [loading]);

  if (loading) return <Spinner />;

  if (error || !stats) {
    return (
      <div className="empty" style={{ marginTop: 40 }}>
        <h4>Dashboard unavailable</h4>
        <p>{error || "No data returned from the API."}</p>
      </div>
    );
  }

  const lowStock = products
    .filter((p) => p.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);

  const cards = [
    { label: "Total Products", value: stats.total_products, icon: Package, color: "var(--accent)", glow: "rgba(52,227,176,0.25)", to: "/products" },
    { label: "Customers", value: stats.total_customers, icon: Users, color: "var(--violet)", glow: "rgba(138,123,255,0.25)", to: "/customers" },
    { label: "Orders Placed", value: stats.total_orders, icon: ShoppingCart, color: "var(--sky)", glow: "rgba(94,197,255,0.25)", to: "/orders" },
    { label: "Total Revenue", value: fmt(stats.total_revenue), icon: DollarSign, color: "var(--amber)", glow: "rgba(255,180,84,0.22)", to: "/orders" },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="title">Overview</div>
          <div className="sub">Real-time snapshot of inventory and order activity.</div>
        </div>
      </div>

      <div className="stat-grid" ref={grid}>
        {cards.map((c) => (
          <button
            className="stat-card clickable-card"
            key={c.label}
            style={{ "--_glow": c.glow }}
            onClick={() => navigate(c.to)}
            type="button"
          >
            <div className="stat-icon" style={{ background: c.glow, color: c.color }}>
              <c.icon size={21} />
            </div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-foot">
              <ArrowUpRight size={14} style={{ color: "var(--accent)" }} /> tracked live
            </div>
          </button>
        ))}
      </div>

      <div className="stat-grid" style={{ marginBottom: 30 }}>
        <button
          className="stat-card clickable-card"
          style={{ "--_glow": "rgba(255,180,84,0.2)" }}
          onClick={() => navigate("/products")}
          type="button"
        >
          <div className="stat-icon" style={{ background: "rgba(255,180,84,0.12)", color: "var(--amber)" }}>
            <TrendingDown size={21} />
          </div>
          <div className="stat-label">Low Stock (≤10)</div>
          <div className="stat-value">{stats.low_stock_count}</div>
        </button>
        <button
          className="stat-card clickable-card"
          style={{ "--_glow": "rgba(255,107,129,0.2)" }}
          onClick={() => navigate("/products")}
          type="button"
        >
          <div className="stat-icon" style={{ background: "rgba(255,107,129,0.12)", color: "var(--rose)" }}>
            <XCircle size={21} />
          </div>
          <div className="stat-label">Out of Stock</div>
          <div className="stat-value">{stats.out_of_stock_count}</div>
        </button>
      </div>

      <div className="dash-cols">
        <div className="panel">
          <div className="panel-head">
            <ShoppingCart size={18} style={{ color: "var(--text-dim)" }} />
            <span className="ph-title">Recent Orders</span>
          </div>
          {orders.length === 0 ? (
            <div className="empty"><h4>No orders yet</h4><p>Placed orders will appear here.</p></div>
          ) : (
            <div className="mini-list">
              {orders.map((o) => (
                <button className="mini-row interactive" key={o.id} onClick={() => navigate("/orders")} type="button">
                  <div className="avatar">#{o.id}</div>
                  <div className="grow">
                    <b>Order #{o.id}</b>
                    <span>{o.items.length} item(s) · {new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className={`badge badge-${o.status}`}>{o.status}</span>
                  <b className="mono" style={{ marginLeft: 12 }}>{fmt(o.total_amount)}</b>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <TrendingDown size={18} style={{ color: "var(--text-dim)" }} />
            <span className="ph-title">Stock Watch</span>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty"><h4>All stocked up</h4><p>No products below threshold.</p></div>
          ) : (
            <div className="mini-list">
              {lowStock.map((p) => (
                <button className="mini-row interactive" key={p.id} onClick={() => navigate("/products")} type="button">
                  <div className="avatar">{p.name[0]}</div>
                  <div className="grow">
                    <b>{p.name}</b>
                    <span className="sku-chip">{p.sku}</span>
                  </div>
                  <span className={`badge ${p.stock === 0 ? "badge-out" : "badge-low"}`}>
                    {p.stock} left
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
