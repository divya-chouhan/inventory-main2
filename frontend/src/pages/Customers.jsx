import { useEffect, useRef, useState } from "react";
import { Plus, Search, Pencil, Trash2, UserPlus, Mail, Phone } from "lucide-react";
import { gsap } from "gsap";
import { Customers as Api, apiError } from "../api/client";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";
import { ConfirmDialog, Spinner, EmptyState } from "../components/Misc.jsx";

const blank = { name: "", email: "", phone: "" };
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Customers() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
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
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm(blank); setErrors({}); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, email: c.email, phone: c.phone || "" }); setErrors({}); setShowForm(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!editing && !emailRe.test(form.email)) e.email = "Valid email required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      if (editing) {
        await Api.update(editing.id, { name: form.name, phone: form.phone });
        toast.success("Customer updated");
      } else {
        await Api.create({ name: form.name.trim(), email: form.email.trim(), phone: form.phone });
        toast.success("Customer created");
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
      toast.success("Customer deleted");
      setToDelete(null);
      load();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const initials = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <div className="page-head">
        <div>
          <div className="title">Customers</div>
          <div className="sub">Your customer directory with unique email enforcement.</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={17} /> New Customer
        </button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="ph-title">Directory</span>
          <div className="topbar-spacer" />
          <div className="search">
            <button className="search-action" type="button" onClick={() => searchRef.current?.focus()} aria-label="Focus customer search" title="Search customers">
              <Search />
            </button>
            <input ref={searchRef} placeholder="Search name or email..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState title="No customers found" hint="Add your first customer to get started." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Customer</th><th>Email</th><th>Phone</th><th></th></tr>
              </thead>
              <tbody ref={tbody}>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="avatar">{initials(c.name)}</div>
                        <span className="cell-strong">{c.name}</span>
                      </div>
                    </td>
                    <td className="cell-dim">
                      <a className="contact-link" href={`mailto:${c.email}`} title={`Email ${c.name}`}>
                        <Mail size={14} />{c.email}
                      </a>
                    </td>
                    <td className="cell-dim">
                      {c.phone ? (
                        <a className="contact-link" href={`tel:${c.phone}`} title={`Call ${c.name}`}>
                          <Phone size={14} />{c.phone}
                        </a>
                      ) : "N/A"}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="act" onClick={() => openEdit(c)} title="Edit" aria-label={`Edit ${c.name}`}><Pencil /></button>
                        <button className="act act-danger" onClick={() => setToDelete(c)} title="Delete" aria-label={`Delete ${c.name}`}><Trash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal
          title={editing ? "Edit Customer" : "New Customer"}
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={busy}>
                <UserPlus size={16} /> {busy ? "Saving…" : editing ? "Save Changes" : "Create Customer"}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="field">
            <label>Email {editing && "(locked)"}</label>
            <input value={form.email} disabled={!!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 0000" />
          </div>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete customer?"
          message={`"${toDelete.name}" will be permanently removed. Customers with existing orders cannot be deleted.`}
          onConfirm={doDelete}
          onClose={() => setToDelete(null)}
          busy={busy}
        />
      )}
    </>
  );
}
