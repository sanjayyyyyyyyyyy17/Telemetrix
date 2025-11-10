import { useEffect, useState } from "react";

export default function AdminApp() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    try {
      const res = await fetch("http://localhost:3000/admin/users", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/login";
        }
        setError("Not authorized or session expired. Please log in as admin.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setUsers(data);
      setError("");
    } catch (err) {
      setError("Server unreachable. Is backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function approveUser(username) {
    try {
      const res = await fetch(`http://localhost:3000/admin/approve/${username}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        alert(`âœ… Approved ${username}`);
        fetchUsers();
      }
    } catch {
      alert("Error approving user.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Control Panel</h1>

      {loading ? (
        <div>Loading users...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : users.length === 0 ? (
        <div>No registered users yet.</div>
      ) : (
        <table className="w-full border border-gray-700 mt-4">
          <thead>
            <tr className="bg-gray-800 text-gray-300">
              <th className="p-2 text-left">Username</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Approved</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.username} className="border-t border-gray-700">
                <td className="p-2">{u.username}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">{u.approved ? "âœ…" : "âŒ"}</td>
                <td className="p-2">
                  {!u.approved && (
                    <button
                      onClick={() => approveUser(u.username)}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}