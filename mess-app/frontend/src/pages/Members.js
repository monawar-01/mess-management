import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { Btn, Card, PageHeader, TableWrap, EmptyState, Spinner, Alert } from "../components/UI";
import Modal from "../components/Modal";
import { fmtDate, initials } from "../utils";

function MemberForm({ initial = {}, onSave, onClose, loading }) {
  const [name, setName] = useState(initial.name || "");
  const [email, setEmail] = useState(initial.email || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!name || !email) { setErr("Name and email are required"); return; }
    if (!initial.id && !password) { setErr("Password is required for new members"); return; }
    setErr("");
    const data = { name, email, phone, ...(password ? { password } : {}) };
    await onSave(data);
  }

  return (
    <>
      <div className="modal-body">
        {err && <div className="alert alert-error">{err}</div>}
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahim Uddin" />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="member@mess.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
        </div>
        <div className="form-group">
          <label className="form-label">{initial.id ? "New Password (leave blank to keep)" : "Password"}</label>
          <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
      </div>
      <div className="modal-footer">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSave} disabled={loading}>{loading ? "Saving…" : initial.id ? "Update" : "Add Member"}</Btn>
      </div>
    </>
  );
}

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setMembers(await api.getMembers()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data) {
    setSaving(true);
    try {
      if (modal?.mode === "edit") await api.updateMember(modal.member.id, data);
      else await api.addMember(data);
      setModal(null); load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(member) {
    if (!window.confirm(`Delete ${member.name}? This will remove all their deposits and meal records.`)) return;
    try { await api.deleteMember(member.id); load(); }
    catch (e) { alert(e.message); }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Members"
        action={<Btn variant="primary" onClick={() => setModal({ mode: "add" })}>+ Add Member</Btn>}
      />
      {error && <Alert type="error">{error}</Alert>}
      <Card>
        <TableWrap>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {members.length === 0
              ? <tr><td colSpan="5"><EmptyState icon="👥" message="No members yet" /></td></tr>
              : members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: ".75rem" }}>{initials(m.name)}</div>
                      {m.name}
                    </div>
                  </td>
                  <td>{m.email}</td>
                  <td>{m.phone || "—"}</td>
                  <td>{fmtDate(m.created_at?.split("T")[0])}</td>
                  <td>
                    <Btn variant="ghost" size="sm" onClick={() => setModal({ mode: "edit", member: m })}>Edit</Btn>
                    <Btn variant="danger" size="sm" style={{ marginLeft: ".5rem" }} onClick={() => handleDelete(m)}>Delete</Btn>
                  </td>
                </tr>
              ))}
          </tbody>
        </TableWrap>
      </Card>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add Member" : "Edit Member"} onClose={() => setModal(null)}>
          <MemberForm
            initial={modal.member || {}}
            onSave={handleSave}
            onClose={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}
    </div>
  );
}
