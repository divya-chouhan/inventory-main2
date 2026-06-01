import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ShoppingCart, X, ChevronDown } from "lucide-react";
import { gsap } from "gsap";
import {
  Orders as Api, Products as ProductsApi, Customers as CustomersApi, apiError,
} from "../api/client";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import { Spinner, EmptyState } from "../components/Misc.jsx";

const fmt = (n) => "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 });
const STATUSES = ["pending", "confirmed", "shipped", "cancelled"];

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([{ product_id: "", quantity: 1 }]);
  const tbody = useRef(null);

  const load = () =>
    Promise.all([Api.list(), ProductsApi.list(), CustomersApi.list()])
      .then(([o, p, c]) => { setOrders(o); setProducts(p); setCustomers(c); })
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!loading && tbody.current) {
      gsap.fromTo(
        tbody.current.querySelectorAll("tr"),
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: "power2.out" }
      );
    }
  }, [loading, orders]);

  const productMap = useMemo(() => Object.fromEntries(products.map((p) => [String(p.id), p])), [products]);
  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [String(c.id), c])), [customers]);

  const total = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const p = productMap[String(l.product_id)];
        return sum + (p ? Number(p.price) * Number(l.quantity || 0) : 0);
      }, 0),
    [lines, productMap]
  );

  const openCreate = () => {
    setCustomerId(customers[0]?.id ? String(customers[0].id) : "");
    setLines([{ product_id: "", quantity: 1 }]);
    setShowForm(true);
  };

  const setLine = (i, patch) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, { product_id: "", quantity: 1 }]);
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const stockHint = (l) => {
    const p = productMap[String(l.product_id)];
    if (!p) return null;
    if (p.stock === 0) return <span className="field-error">Out of stock</span>;
    if (Number(l.quantity) > p.stock) return <span className="field-error">Only {p.stock} available</span>;
    return <span style={{ fontSize: ".76rem", color: "var(--text-faint)" }}>{p.stock} in stock · {fmt(p.price)} ea</span>;
  };

  const canSubmit =
    customerId &&
    lines.length > 0 &&
    lines.every((l) => l.product_id && Number(l.quantity) > 0) &&
    lines.every((l) => {
      const p = productMap[String(l.product_id)];
      return p && Number(l.quantity) <= p.stock;
    });

  const submit = async () => {
    setBusy(true);
    try {
      await Api.create({
        customer_id: Number(customerId),
        items: lines.map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) })),
      });
      toast.success("Order placed · stock updated");
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (order, status) => {
    try {
      await Api.setStatus(order.id, status);
      toast.success(status === "cancelled" ? "Order cancelled · stock restored" : `Marked ${status}`);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="title">Orders</div>
          <div className="sub">Place orders. Stock is validated and reduced automatically.</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate} disabled={customers.length === 0 || products.length === 0}>
          <Plus size={17} /> New Order
        </button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="ph-title">All Orders</span>
        </div>
        {loading ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders yet" hint="Place your first order to see it here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody ref={tbody}>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="cell-strong mono">#{o.id}</td>
                    <td>{customerMap[String(o.customer_id)]?.name || `Customer ${o.customer_id}`}</td>
                    <td className="cell-dim mono">{o.items.reduce((s, it) => s + it.quantity, 0)} unit(s)</td>
                    <td className="mono cell-strong">{fmt(o.total_amount)}</td>
                    <td>
                      <div className="status-select" style={{ position: "relative", display: "inline-block" }}>
                        <span className={`badge badge-${o.status} status-badge`}>
                          {o.status}
                          <ChevronDown size={13} aria-hidden="true" />
                        </span>
                        <select
                          value={o.status}
                          onChange={(e) => changeStatus(o, e.target.value)}
                          style={{
                            position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%",
                          }}
                          title="Change status"
                          aria-label={`Change status for order ${o.id}`}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="cell-dim">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal
          title="New Order"
          wide
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={busy || !canSubmit}>
                <ShoppingCart size={16} /> {busy ? "Placing…" : "Place Order"}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}
            </select>
          </div>

          <label style={{ fontSize: ".82rem", color: "var(--text-dim)", fontWeight: 500, display: "block", margin: "6px 0 10px" }}>
            Line items
          </label>

          {lines.map((l, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div className="line-item">
                <select value={l.product_id} onChange={(e) => setLine(i, { product_id: e.target.value })}
                  style={{ padding: "11px 13px", borderRadius: 11, background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock === 0}>
                      {p.name} ({p.sku}){p.stock === 0 ? " - out of stock" : ""}
                    </option>
                  ))}
                </select>
                <input type="number" min="1" value={l.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                  style={{ padding: "11px 13px", borderRadius: 11, background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }} />
                <button className="act act-danger" onClick={() => removeLine(i)} disabled={lines.length === 1} title="Remove" aria-label={`Remove line item ${i + 1}`}>
                  <X />
                </button>
              </div>
              <div style={{ paddingLeft: 2, marginTop: 4 }}>{stockHint(l)}</div>
            </div>
          ))}

          <button className="btn btn-ghost" onClick={addLine} style={{ marginTop: 4 }}>
            <Plus size={16} /> Add item
          </button>

          <div className="order-summary">
            <span style={{ color: "var(--text-dim)" }}>Order total</span>
            <span className="total">{fmt(total)}</span>
          </div>
        </Modal>
      )}
    </>
  );
}
