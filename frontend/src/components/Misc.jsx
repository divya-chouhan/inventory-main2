import { AlertTriangle, Inbox } from "lucide-react";
import Modal from "./Modal";

export function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onClose, busy }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            <AlertTriangle size={16} /> {busy ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: "var(--text-dim)", lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

export function Spinner() {
  return <div className="spinner" />;
}

export function EmptyState({ title, hint }) {
  return (
    <div className="empty">
      <Inbox />
      <h4>{title}</h4>
      <p>{hint}</p>
    </div>
  );
}
