import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import { Btn, Card, Alert } from "../components/UI";
import { initials } from "../utils";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSave() {
    if (!name) { setMessage({ type: "error", text: "Name is required" }); return; }
    setLoading(true); setMessage(null);
    try {
      const updated = await api.updateProfile({ name, phone, ...(password ? { password } : {}) });
      updateUser(updated);
      setPassword("");
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="page-title" style={{ marginBottom: "1.25rem" }}>My Profile</h2>
      <Card style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: "1.3rem" }}>
            {initials(user?.name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{user?.name}</div>
            <div style={{ color: "var(--muted)", fontSize: ".875rem" }}>{user?.email}</div>
            <span className={`badge badge-${user?.role === "manager" ? "amber" : "blue"}`} style={{ marginTop: ".25rem", display: "inline-block" }}>
              {user?.role === "manager" ? "Manager" : "Member"}
            </span>
          </div>
        </div>

        {message && <Alert type={message.type}>{message.text}</Alert>}

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
        </div>
        <div className="form-group">
          <label className="form-label">Email (read-only)</label>
          <input className="form-input" type="email" value={user?.email || ""} readOnly style={{ background: "#f8f9fa", cursor: "not-allowed" }} />
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
          <div style={{ fontWeight: 500, marginBottom: ".75rem" }}>Change Password</div>
          <div className="form-group">
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current password" />
          </div>
        </div>
        <Btn variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? "Saving…" : "Save Changes"}
        </Btn>
      </Card>
    </div>
  );
}
