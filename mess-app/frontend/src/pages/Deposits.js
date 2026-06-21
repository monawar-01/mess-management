import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import { Btn, Card, PageHeader, StatGrid, StatCard, TableWrap, EmptyState, Spinner, Alert } from "../components/UI";
import Modal from "../components/Modal";
import { fmtTk, fmtDate, todayStr } from "../utils";

function DepositForm({ members, initial = {}, onSave, onClose, loading }) {
  const [memberId, setMemberId] = useState(initial.member_id || (members[0]?.id ?? ""));
  const [amount, setAmount] = useState(initial.amount || "");
  const [date, setDate] = useState(initial.deposit_date || todayStr());
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!memberId || !amount || !date) { setErr("All fields are required"); return; }
    if (parseFloat(amount) <= 0) { setErr("Amount must be positive"); return; }
    setErr("");
    await onSave({ member_id: parseInt(memberId), amount: parseFloat(amount), deposit_date: date });
  }

  return (
    <>
      <div className="modal-body">
        {err && <div className="alert alert-error">{err}</div>}
        <div className="form-group">
          <label className="form-label">Member</label>
          <select className="form-input" value={memberId} onChange={e => setMemberId(e.target.value)}>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Amount (Tk)</label>
          <input className="form-input" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 500" />
        </div>
        <div className="form-group">
          <label className="form-label">Deposit Date</label>
          <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} max={todayStr()} />
        </div>
      </div>
      <div className="modal-footer">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Save"}</Btn>
      </div>
    </>
  );
}

export default function Deposits() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [deposits, setDeposits] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | {mode:'add'} | {mode:'edit', deposit}

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [deps, mems] = await Promise.all([api.getDeposits(), isManager ? api.getMembers() : Promise.resolve([])]);
      setDeposits(deps);
      setMembers(mems);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data) {
    setSaving(true);
    try {
      if (modal?.mode === "edit") {
        await api.updateDeposit(modal.deposit.id, data);
      } else {
        await api.addDeposit(data);
      }
      setModal(null);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this deposit record?")) return;
    try {
      await api.deleteDeposit(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return <Spinner />;

  // ── MEMBER VIEW ──────────────────────────────────────────
  if (!isManager) {
    const total = deposits.reduce((s, d) => s + d.amount, 0);
    return (
      <div>
        <PageHeader title="My Deposits" />
        <StatGrid>
          <StatCard label="Total Deposit" value={fmtTk(total)} />
          <StatCard label="Total Entries" value={deposits.length} />
        </StatGrid>
        <Card>
          {error && <Alert type="error">{error}</Alert>}
          <TableWrap>
            <thead>
              <tr><th>Date</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {deposits.length === 0
                ? <tr><td colSpan="2"><EmptyState icon="💰" message="No deposit records yet" /></td></tr>
                : deposits.map(d => (
                  <tr key={d.id}>
                    <td>{fmtDate(d.deposit_date)}</td>
                    <td><b>{fmtTk(d.amount)}</b></td>
                  </tr>
                ))}
              {deposits.length > 0 && (
                <tr className="total-row">
                  <td><b>Total Deposit</b></td>
                  <td><b>{fmtTk(total)}</b></td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </Card>
      </div>
    );
  }

  // ── MANAGER VIEW ─────────────────────────────────────────
  const grouped = members.map(m => {
    const mDeps = deposits.filter(d => d.member_id === m.id)
      .sort((a, b) => a.deposit_date.localeCompare(b.deposit_date));
    const total = mDeps.reduce((s, d) => s + d.amount, 0);
    return { member: m, deps: mDeps, total };
  });

  return (
    <div>
      <PageHeader
        title="Deposit Management"
        action={<Btn variant="primary" onClick={() => setModal({ mode: "add" })}>+ Add Deposit</Btn>}
      />
      {error && <Alert type="error">{error}</Alert>}

      <StatGrid>
        {grouped.map(g => (
          <StatCard key={g.member.id} label={g.member.name} value={fmtTk(g.total)} />
        ))}
      </StatGrid>

      {grouped.map(g => (
        <Card key={g.member.id} className="mb-1">
          <div className="member-card-header">
            <div className="avatar" style={{ width: 40, height: 40, fontSize: ".85rem" }}>
              {g.member.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{g.member.name}</div>
              <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>{g.member.email}</div>
            </div>
            <span className="badge badge-green" style={{ marginLeft: "auto" }}>Total: {fmtTk(g.total)}</span>
          </div>
          <TableWrap>
            <thead>
              <tr><th>Date</th><th>Amount</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {g.deps.length === 0
                ? <tr><td colSpan="3" className="empty-cell">No deposits</td></tr>
                : g.deps.map(d => (
                  <tr key={d.id}>
                    <td>{fmtDate(d.deposit_date)}</td>
                    <td><b>{fmtTk(d.amount)}</b></td>
                    <td>
                      <Btn variant="ghost" size="sm" onClick={() => setModal({ mode: "edit", deposit: d })}>Edit</Btn>
                      <Btn variant="danger" size="sm" style={{ marginLeft: ".5rem" }} onClick={() => handleDelete(d.id)}>Del</Btn>
                    </td>
                  </tr>
                ))}
              {g.deps.length > 0 && (
                <tr className="total-row">
                  <td colSpan="2"><b>Total Deposit</b></td>
                  <td><b>{fmtTk(g.total)}</b></td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </Card>
      ))}

      {modal && (
        <Modal title={modal.mode === "add" ? "Add Deposit" : "Edit Deposit"} onClose={() => setModal(null)}>
          <DepositForm
            members={members}
            initial={modal.deposit || {}}
            onSave={handleSave}
            onClose={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}
    </div>
  );
}
