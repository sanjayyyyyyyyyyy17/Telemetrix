const jsonHeaders = { "Content-Type": "application/json" };

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    headers: jsonHeaders,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  return { ok: res.ok, status: res.status, data };
}

export const api = {
  login: (u,p) => request("/login", { method: "POST", body: { username: u, password: p } }),
  selectCar: (car,pin) => request("/select-car", { method: "POST", body: { car, pin } }),
  logout: () => request("/logout", { method: "POST" }),
  welcome: () => request("/api/welcome"),
  day: (date) => request(`/api/dashboard/${date}`),
  metric: (metric,date) => request(`/api/dashboard/${metric}/${date}`),
}
