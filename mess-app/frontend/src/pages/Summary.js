import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import { Card, StatGrid, StatCard, TableWrap, Badge, Spinner, Alert } from "../components/UI";
import { fmtTk } from "../utils";

export default function Summary() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getSummary()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;

  // ── MEMBER VIEW ──────────────────────────────────────────
  if (!isManager) {
    const { totalDeposit, memberMeals, mealRate, memberExpense, balance } = data;
    return (
      <div>
        <h2 className="page-title" style={{ marginBottom: "1.25rem" }}>My Summary</h2>
        <StatGrid>
          <StatCard label="Total Deposit" value={fmtTk(totalDeposit)} />
          <StatCard label="Total Meals" value={memberMeals || 0} />
          <StatCard label="Meal Rate" value={`${(mealRate || 0).toFixed(2)} Tk`} />
          <StatCard label="Balance" value={fmtTk(balance)} color={balance >= 0 ? "var(--success)" : "var(--danger)"} />
        </StatGrid>
        <Card>
          <h3 className="card-title" style={{ marginBottom: "1rem" }}>Breakdown</h3>
          <table style={{ width: "100%", fontSize: ".9rem" }}>
            <tbody>
              {[
                ["Total Deposit", fmtTk(totalDeposit)],
                ["Total Meals", memberMeals || 0],
                ["Meal Rate", `${(mealRate || 0).toFixed(2)} Tk/meal`],
                ["Total Expense", fmtTk(memberExpense)],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: ".6rem 0", color: "var(--muted)" }}>{label}</td>
                  <td style={{ textAlign: "right", fontWeight: 500 }}>{val}</td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td style={{ padding: ".75rem 0", fontWeight: 700 }}>Balance</td>
                <td style={{ textAlign: "right", fontWeight: 700, color: balance >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {fmtTk(balance)}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  // ── MANAGER VIEW ─────────────────────────────────────────
  const { mealRate, totalMeals, totalExpenses, totalDeposits, members } = data;
  return (
    <div>
      <h2 className="page-title" style={{ marginBottom: "1.25rem" }}>Summary</h2>
      <StatGrid>
        <StatCard label="Total Deposits" value={fmtTk(totalDeposits)} />
        <StatCard label="Total Expenses" value={fmtTk(totalExpenses)} />
        <StatCard label="Total Meals" value={totalMeals} />
        <StatCard label="Meal Rate" value={`${(mealRate || 0).toFixed(2)} Tk`} />
      </StatGrid>

      <Card>
        <h3 className="card-title" style={{ marginBottom: "1rem" }}>Individual Summary</h3>
        <TableWrap>
          <thead>
            <tr>
              <th>Member</th><th>Deposit</th><th>Meals</th>
              <th>Expense</th><th>Balance</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map(s => (
              <tr key={s.member.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                    <div className="avatar" style={{ width: 30, height: 30, fontSize: ".72rem" }}>
                      {s.member.name.slice(0, 2).toUpperCase()}
                    </div>
                    {s.member.name}
                  </div>
                </td>
                <td>{fmtTk(s.totalDeposit)}</td>
                <td>{s.memberMeals}</td>
                <td>{fmtTk(s.memberExpense)}</td>
                <td style={{ color: s.balance >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                  {fmtTk(s.balance)}
                </td>
                <td>
                  <Badge type={s.balance >= 0 ? "green" : "amber"}>
                    {s.balance >= 0 ? "Credit" : "Due"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}
