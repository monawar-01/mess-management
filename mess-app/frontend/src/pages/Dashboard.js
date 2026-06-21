import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import { StatGrid, StatCard, Card, Spinner, TableWrap } from "../components/UI";
import { fmtTk, fmtDate } from "../utils";

export default function Dashboard() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.getSummary(),
      api.getDeposits(),
      api.getExpenses(),
    ])
      .then(([summary, deposits, expenses]) => setData({ summary, deposits, expenses }))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="alert alert-error">{error}</div>;

  const { summary, deposits, expenses } = data;

  if (isManager) {
    const recentDeposits = [...deposits].sort((a,b) => b.deposit_date.localeCompare(a.deposit_date)).slice(0, 6);
    const recentExpenses = [...expenses].sort((a,b) => b.expense_date.localeCompare(a.expense_date)).slice(0, 6);
    return (
      <div>
        <h2 className="page-title" style={{ marginBottom: "1.25rem" }}>Dashboard</h2>
        <StatGrid>
          <StatCard label="Total Deposits" value={fmtTk(summary.totalDeposits)} />
          <StatCard label="Total Expenses" value={fmtTk(summary.totalExpenses)} />
          <StatCard label="Total Meals" value={summary.totalMeals} />
          <StatCard label="Meal Rate" value={`${(summary.mealRate || 0).toFixed(2)} Tk`} />
          <StatCard label="Members" value={summary.members?.length || 0} />
        </StatGrid>
        <div className="two-col">
          <Card>
            <h3 className="card-title">Recent Deposits</h3>
            <TableWrap>
              <thead><tr><th>Member</th><th>Date</th><th>Amount</th></tr></thead>
              <tbody>
                {recentDeposits.length === 0
                  ? <tr><td colSpan="3" className="empty-cell">No deposits yet</td></tr>
                  : recentDeposits.map(d => (
                    <tr key={d.id}>
                      <td>{d.member_name}</td>
                      <td>{fmtDate(d.deposit_date)}</td>
                      <td><b>{fmtTk(d.amount)}</b></td>
                    </tr>
                  ))}
              </tbody>
            </TableWrap>
          </Card>
          <Card>
            <h3 className="card-title">Recent Expenses</h3>
            <TableWrap>
              <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
              <tbody>
                {recentExpenses.length === 0
                  ? <tr><td colSpan="3" className="empty-cell">No expenses yet</td></tr>
                  : recentExpenses.map(e => (
                    <tr key={e.id}>
                      <td>{fmtDate(e.expense_date)}</td>
                      <td>{e.description}</td>
                      <td><b>{fmtTk(e.amount)}</b></td>
                    </tr>
                  ))}
              </tbody>
            </TableWrap>
          </Card>
        </div>
      </div>
    );
  }

  // Member dashboard
  const myDeposits = deposits.slice(0, 5);
  const balance = summary.balance || 0;
  return (
    <div>
      <h2 className="page-title" style={{ marginBottom: "1.25rem" }}>My Dashboard</h2>
      <StatGrid>
        <StatCard label="My Deposits" value={fmtTk(summary.totalDeposit)} />
        <StatCard label="My Meals" value={summary.memberMeals || 0} />
        <StatCard label="My Expense" value={fmtTk(summary.memberExpense)} />
        <StatCard label="Balance" value={fmtTk(balance)} color={balance >= 0 ? "var(--success)" : "var(--danger)"} />
      </StatGrid>
      <Card>
        <h3 className="card-title">Recent Deposits</h3>
        <TableWrap>
          <thead><tr><th>Date</th><th>Amount</th></tr></thead>
          <tbody>
            {myDeposits.length === 0
              ? <tr><td colSpan="2" className="empty-cell">No deposits yet</td></tr>
              : myDeposits.map(d => (
                <tr key={d.id}>
                  <td>{fmtDate(d.deposit_date)}</td>
                  <td><b>{fmtTk(d.amount)}</b></td>
                </tr>
              ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}
