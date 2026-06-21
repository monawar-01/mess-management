import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Deposits from "./pages/Deposits";
import Meals from "./pages/Meals";
import Expenses from "./pages/Expenses";
import Summary from "./pages/Summary";
import Members from "./pages/Members";
import Profile from "./pages/Profile";
import { Spinner } from "./components/UI";
import "./index.css";
import "./App.css";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}

function ManagerRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== "manager") return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="meals" element={<Meals />} />
            <Route path="deposits" element={<Deposits />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="summary" element={<Summary />} />
            <Route path="members" element={<ManagerRoute><Members /></ManagerRoute>} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
