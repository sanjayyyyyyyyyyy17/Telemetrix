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
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      setUsers(data);
    } catch {
      setError("Server unreachable");
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
        alert(`✔ Approved ${username}`);
        fetchUsers();
      } else {
        alert("Error approving user");
      }
    } catch {
      alert("Server error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4 text-green-400">Admin Control Panel</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border border-gray-700 mt-4">
          <thead>
            <tr className="bg-gray-800 text-gray-300">
              <th className="p-2 text-left">Username</th>
              <th className="p-2 text-left">Requested Role</th>
              <th className="p-2 text-left">Current Role</th>
              <th className="p-2 text-left">Approved</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.username} className="border-t border-gray-700">
                <td className="p-2">{u.username}</td>
                <td className="p-2">{u.pendingRole || "-"}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">{u.approved ? "✔" : "✖"}</td>

                <td className="p-2">
                  {!u.approved && u.role === "pending" && (
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
