import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import { Btn, Card, PageHeader, StatGrid, StatCard, TableWrap, Badge, EmptyState, Spinner, Alert } from "../components/UI";
import Modal from "../components/Modal";
import { fmtTk, fmtDate, todayStr } from "../utils";

const CATEGORIES = ["food", "gas", "utility", "general"];

function ExpenseForm({ initial = {}, onSave, onClose, loading }) {
  const [amount, setAmount] = useState(initial.amount || "");
  const [description, setDescription] = useState(initial.description || "");
  const [category, setCategory] = useState(initial.category || "general");
  const [date, setDate] = useState(initial.expense_date || todayStr());
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!amount || !description || !date) { setErr("All fields are required"); return; }
    if (parseFloat(amount) <= 0) { setErr("Amount must be positive"); return; }
    setErr("");
    await onSave({ amount: parseFloat(amount), description, category, expense_date: date });
  }

  return (
    <>
      <div className="modal-body">
        {err && <div className="alert alert-error">{err}</div>}
        <div className="form-group">
          <label className="form-label">Amount (Tk)</label>
          <input className="form-input" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 300" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Groceries" />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      <div className="modal-footer">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Save"}</Btn>
      </div>
    </>
  );
}

export default function Expenses() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setExpenses(await api.getExpenses()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data) {
    setSaving(true);
    try {
      if (modal?.mode === "edit") await api.updateExpense(modal.expense.id, data);
      else await api.addExpense(data);
      setModal(null); load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense?")) return;
    try { await api.deleteExpense(id); load(); } catch (e) { alert(e.message); }
  }

  if (loading) return <Spinner />;

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const sorted = [...expenses].sort((a, b) => b.expense_date.localeCompare(a.expense_date));

  return (
    <div>
      <PageHeader
        title="Expenses"
        action={isManager && <Btn variant="primary" onClick={() => setModal({ mode: "add" })}>+ Add Expense</Btn>}
      />
      {error && <Alert type="error">{error}</Alert>}
      <StatGrid>
        <StatCard label="Total Expenses" value={fmtTk(total)} />
        <StatCard label="Total Entries" value={expenses.length} />
      </StatGrid>
      <Card>
        <TableWrap>
          <thead>
            <tr>
              <th>Date</th><th>Description</th><th>Category</th><th>Amount</th>
              {isManager && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0
              ? <tr><td colSpan={isManager ? 5 : 4}><EmptyState icon="🧾" message="No expenses yet" /></td></tr>
              : sorted.map(e => (
                <tr key={e.id}>
                  <td>{fmtDate(e.expense_date)}</td>
                  <td>{e.description}</td>
                  <td><Badge type="blue">{e.category}</Badge></td>
                  <td><b>{fmtTk(e.amount)}</b></td>
                  {isManager && (
                    <td>
                      <Btn variant="ghost" size="sm" onClick={() => setModal({ mode: "edit", expense: e })}>Edit</Btn>
                      <Btn variant="danger" size="sm" style={{ marginLeft: ".5rem" }} onClick={() => handleDelete(e.id)}>Del</Btn>
                    </td>
                  )}
                </tr>
              ))}
            {sorted.length > 0 && (
              <tr className="total-row">
                <td colSpan={isManager ? 3 : 3}><b>Total</b></td>
                <td><b>{fmtTk(total)}</b></td>
                {isManager && <td />}
              </tr>
            )}
          </tbody>
        </TableWrap>
      </Card>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add Expense" : "Edit Expense"} onClose={() => setModal(null)}>
          <ExpenseForm
            initial={modal.expense || {}}
            onSave={handleSave}
            onClose={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}
    </div>
  );
}
