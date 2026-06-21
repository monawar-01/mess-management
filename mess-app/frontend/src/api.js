const BASE_URL = process.env.REACT_APP_API_URL || "";

function getToken() {
  return localStorage.getItem("mess_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),
  updateProfile: (data) => request("/auth/profile", { method: "PUT", body: data }),

  // Members
  getMembers: () => request("/members"),
  addMember: (data) => request("/members", { method: "POST", body: data }),
  updateMember: (id, data) => request(`/members/${id}`, { method: "PUT", body: data }),
  deleteMember: (id) => request(`/members/${id}`, { method: "DELETE" }),

  // Deposits
  getDeposits: () => request("/deposits"),
  getMemberDeposits: (id) => request(`/deposits/member/${id}`),
  addDeposit: (data) => request("/deposits", { method: "POST", body: data }),
  updateDeposit: (id, data) => request(`/deposits/${id}`, { method: "PUT", body: data }),
  deleteDeposit: (id) => request(`/deposits/${id}`, { method: "DELETE" }),

  // Meals
  getMeals: () => request("/meals"),
  addMeal: (data) => request("/meals", { method: "POST", body: data }),
  updateMeal: (id, data) => request(`/meals/${id}`, { method: "PUT", body: data }),
  deleteMeal: (id) => request(`/meals/${id}`, { method: "DELETE" }),

  // Expenses
  getExpenses: () => request("/expenses"),
  addExpense: (data) => request("/expenses", { method: "POST", body: data }),
  updateExpense: (id, data) => request(`/expenses/${id}`, { method: "PUT", body: data }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: "DELETE" }),

  // Summary
  getSummary: () => request("/summary"),
};
