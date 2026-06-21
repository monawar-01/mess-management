import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import { Btn, Card, PageHeader, StatGrid, StatCard, TableWrap, EmptyState, Spinner, Alert } from "../components/UI";
import Modal from "../components/Modal";
import { fmtDate, todayStr } from "../utils";

function MealForm({ members, initial = {}, onSave, onClose, loading }) {
  const [memberId, setMemberId] = useState(initial.member_id || (members[0]?.id ?? ""));
  const [date, setDate] = useState(initial.date || todayStr());
  const [breakfast, setBreakfast] = useState(!!initial.breakfast);
  const [lunch, setLunch] = useState(!!initial.lunch);
  const [dinner, setDinner] = useState(!!initial.dinner);
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!memberId || !date) { setErr("Member and date are required"); return; }
    setErr("");
    await onSave({ member_id: parseInt(memberId), date, breakfast, lunch, dinner });
  }

  return (
    <>
      <div className="modal-body">
        {err && <div className="alert alert-error">{err}</div>}
        {members.length > 0 && (
          <div className="form-group">
            <label className="form-label">Member</label>
            <select className="form-input" value={memberId} onChange={e => setMemberId(e.target.value)}>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Date</label>
          <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="meal-checks">
          {[["breakfast", breakfast, setBreakfast, "🌅 Breakfast"],
            ["lunch", lunch, setLunch, "☀️ Lunch"],
            ["dinner", dinner, setDinner, "🌙 Dinner"]].map(([key, val, set, label]) => (
            <label key={key} className="meal-check-label">
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div className="modal-footer">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Save"}</Btn>
      </div>
    </>
  );
}

export default function Meals() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [meals, setMeals] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [memberFilter, setMemberFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState(todayStr().slice(0, 7));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, mems] = await Promise.all([api.getMeals(), isManager ? api.getMembers() : Promise.resolve([])]);
      setMeals(m); setMembers(mems);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [isManager]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data) {
    setSaving(true);
    try {
      if (modal?.mode === "edit") await api.updateMeal(modal.meal.id, data);
      else await api.addMeal(data);
      setModal(null); load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this meal record?")) return;
    try { await api.deleteMeal(id); load(); } catch (e) { alert(e.message); }
  }

  if (loading) return <Spinner />;

  const filteredMeals = meals.filter(m => {
    if (memberFilter && m.member_id !== parseInt(memberFilter)) return false;
    if (monthFilter && !m.date.startsWith(monthFilter)) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalMeals = meals.reduce((s, m) => s + (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0), 0);
  const myBreakfasts = meals.filter(m => m.breakfast).length;
  const myLunches = meals.filter(m => m.lunch).length;
  const myDinners = meals.filter(m => m.dinner).length;

  return (
    <div>
      <PageHeader
        title={isManager ? "Meal Records" : "My Meals"}
        action={isManager && <Btn variant="primary" onClick={() => setModal({ mode: "add" })}>+ Add Meal</Btn>}
      />
      {error && <Alert type="error">{error}</Alert>}
      <StatGrid>
        <StatCard label="Total Meals" value={totalMeals} />
        <StatCard label="Breakfasts" value={myBreakfasts} />
        <StatCard label="Lunches" value={myLunches} />
        <StatCard label="Dinners" value={myDinners} />
      </StatGrid>

      {isManager && (
        <div className="filter-row">
          <select className="form-input" style={{ width: "auto" }} value={memberFilter} onChange={e => setMemberFilter(e.target.value)}>
            <option value="">All Members</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input className="form-input" style={{ width: "auto" }} type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
        </div>
      )}

      <Card>
        <TableWrap>
          <thead>
            <tr>
              {isManager && <th>Member</th>}
              <th>Date</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th><th>Total</th>
              {isManager && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredMeals.length === 0
              ? <tr><td colSpan={isManager ? 7 : 5}><EmptyState icon="🍱" message="No meal records found" /></td></tr>
              : filteredMeals.map(m => {
                const t = (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0);
                return (
                  <tr key={m.id}>
                    {isManager && <td>{m.member_name || members.find(x => x.id === m.member_id)?.name || "—"}</td>}
                    <td>{fmtDate(m.date)}</td>
                    <td>{m.breakfast ? "✅" : "—"}</td>
                    <td>{m.lunch ? "✅" : "—"}</td>
                    <td>{m.dinner ? "✅" : "—"}</td>
                    <td><b>{t}</b></td>
                    {isManager && (
                      <td>
                        <Btn variant="ghost" size="sm" onClick={() => setModal({ mode: "edit", meal: m })}>Edit</Btn>
                        <Btn variant="danger" size="sm" style={{ marginLeft: ".5rem" }} onClick={() => handleDelete(m.id)}>Del</Btn>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </TableWrap>
      </Card>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add Meal" : "Edit Meal"} onClose={() => setModal(null)}>
          <MealForm
            members={members}
            initial={modal.meal || {}}
            onSave={handleSave}
            onClose={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}
    </div>
  );
}
