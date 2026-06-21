import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-icon">🍽️</span>
          <h1>Mess Manager</h1>
          <p>Sign in to your account</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <div className="demo-accounts">
          <p className="demo-title">Demo accounts</p>
          <div className="demo-item">👔 <b>Manager:</b> manager@mess.com / manager123</div>
          <div className="demo-item">👤 <b>Member:</b> rahim@mess.com / member123</div>
          <div className="demo-item">👤 <b>Member:</b> karim@mess.com / member123</div>
        </div>
      </div>
    </div>
  );
}
