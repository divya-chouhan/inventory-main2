import { useEffect, useRef, useState } from "react";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { gsap } from "gsap";
import { Products as Api, apiError } from "../api/client";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import { ConfirmDialog, Spinner, EmptyState } from "../components/Misc.jsx";

const fmt = (n) => "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 });
const stockBadge = (s) =>
  s === 0 ? ["badge-out", "Out of stock"] : s <= 10 ? ["badge-low", `${s} low`] : ["badge-ok", `${s} in stock`];

const blank = { sku: "", name: "", description: "", price: "", stock: "" };

export default function Products() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // object or null
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const tbody = useRef(null);
  const searchRef = useRef(null);
  const didAnimateRows = useRef(false);

  const load = () =>
    Api.list().then(setItems).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!loading && tbody.current && !didAnimateRows.current) {
      didAnimateRows.current = true;
      gsap.fromTo(
        tbody.current.querySelectorAll("tr"),
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: "power2.out" }
      );
    }
  }, [loading, items]);

  const filtered = items.filter(
    (p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm(blank); setErrors({}); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ sku: p.sku, name: p.name, description: p.description || "", price: p.price, stock: p.stock });
    setErrors({}); setShowForm(true);
  };

  const validate = () => {
    const e = {};
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (!form.name.trim()) e.name = "Name is required";
    if (form.price === "" || Number(form.price) < 0) e.price = "Valid price required";
    if (form.stock === "" || Number(form.stock) < 0 || !Number.isInteger(Number(form.stock)))
      e.stock = "Whole number ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      if (editing) {
        await Api.update(editing.id, {
          name: form.name, description: form.description,
          price: Number(form.price), stock: Number(form.stock),
        });
        toast.success("Product updated");
      } else {
        await Api.create({
          sku: form.sku.trim(), name: form.name.trim(), description: form.description,
          price: Number(form.price), stock: Number(form.stock),
        });
        toast.success("Product created");
      }
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await Api.remove(toDelete.id);
      toast.success("Product deleted");
      setToDelete(null);
      load();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="title">Products</div>
          <div className="sub">Manage your catalog, pricing, and inventory levels.</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={17} /> New Product
        </button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="ph-title">Catalog</span>
          <div className="topbar-spacer" />
          <div className="search">
            <button className="search-action" type="button" onClick={() => searchRef.current?.focus()} aria-label="Focus product search" title="Search products">
              <Search />
            </button>
            <input ref={searchRef} placeholder="Search name or SKU..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState title="No products found" hint="Create your first product to get started." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody ref={tbody}>
                {filtered.map((p) => {
                  const [cls, label] = stockBadge(p.stock);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="cell-strong">{p.name}</div>
                        {p.description && <div className="cell-dim" style={{ fontSize: ".8rem" }}>{p.description}</div>}
                      </td>
                      <td><span className="sku-chip">{p.sku}</span></td>
                      <td className="mono">{fmt(p.price)}</td>
                      <td className="mono">{p.stock}</td>
                      <td><span className={`badge ${cls}`}>{label}</span></td>
                      <td>
                        <div className="row-actions">
                          <button className="act" onClick={() => openEdit(p)} title="Edit" aria-label={`Edit ${p.name}`}><Pencil /></button>
                          <button className="act act-danger" onClick={() => setToDelete(p)} title="Delete" aria-label={`Delete ${p.name}`}><Trash2 /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal
          title={editing ? "Edit Product" : "New Product"}
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={busy}>
                <Package size={16} /> {busy ? "Saving…" : editing ? "Save Changes" : "Create Product"}
              </button>
            </>
          }
        >
          <div className="field">
            <label>SKU {editing && "(locked)"}</label>
            <input
              value={form.sku} disabled={!!editing}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="e.g. KB-MX-001"
            />
            {errors.sku && <div className="field-error">{errors.sku}</div>}
          </div>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Price (USD)</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              {errors.price && <div className="field-error">{errors.price}</div>}
            </div>
            <div className="field">
              <label>Stock</label>
              <input type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
              {errors.stock && <div className="field-error">{errors.stock}</div>}
            </div>
          </div>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete product?"
          message={`"${toDelete.name}" (${toDelete.sku}) will be permanently removed. Products referenced by orders cannot be deleted.`}
          onConfirm={doDelete}
          onClose={() => setToDelete(null)}
          busy={busy}
        />
      )}
    </>
  );
}
