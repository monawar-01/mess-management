import React from "react";
import "./UI.css";

export function Btn({ variant = "primary", size, className = "", children, ...props }) {
  return (
    <button className={`btn btn-${variant}${size ? ` btn-${size}` : ""} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function FormGroup({ label, error, children }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function Input(props) {
  return <input className="form-input" {...props} />;
}

export function Select({ children, ...props }) {
  return <select className="form-input" {...props}>{children}</select>;
}

export function Alert({ type = "error", children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-num" style={color ? { color } : {}}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function StatGrid({ children }) {
  return <div className="stat-grid">{children}</div>;
}

export function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function PageHeader({ title, action }) {
  return (
    <div className="page-header">
      <h2 className="page-title">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Badge({ type = "blue", children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

export function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>;
}

export function EmptyState({ icon = "📭", message }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <p>{message}</p>
    </div>
  );
}

export function TableWrap({ children }) {
  return <div className="table-wrap"><table className="data-table">{children}</table></div>;
}
