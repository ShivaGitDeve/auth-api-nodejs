import { useEffect, useMemo, useState } from "react";
import { FiRefreshCw, FiSearch, FiShield, FiTrash2, FiUser, FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../auth/Auth-context";
import AppShell from "../../components/AppShell";
import { Avatar, Button, Card, RoleBadge, Spinner } from "../../components/ui";

const Admin = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(
    () =>
      users.filter((u) =>
        `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  );

  const toggleRole = async (u) => {
    const role = u.role === "admin" ? "user" : "admin";
    setBusyId(u.id);
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role });
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role } : x)));
      toast.success(`${u.name} is now ${role}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Role update failed");
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (u) => {
    setBusyId(u.id);
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers((list) => list.filter((x) => x.id !== u.id));
      toast.success(`${u.name} deleted`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  const stats = [
    { label: "Total users", value: users.length, icon: FiUsers, accent: "from-violet-500 to-fuchsia-500" },
    { label: "Admins", value: users.filter((u) => u.role === "admin").length, icon: FiShield, accent: "from-fuchsia-500 to-pink-500" },
    { label: "Users", value: users.filter((u) => u.role !== "admin").length, icon: FiUser, accent: "from-cyan-400 to-blue-600" },
  ];

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-sm font-medium text-fuchsia-300">Admin panel</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">User management</h1>
          <p className="mt-2 text-slate-400">Manage roles and accounts across the platform.</p>
        </div>
        <Button variant="ghost" onClick={fetchUsers}>
          <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, accent }, i) => (
          <Card key={label} className="flex items-center gap-4 p-5 animate-fade-up" style={{ animationDelay: `${100 + i * 80}ms` }}>
            <div className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${accent}`}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
              <p className="font-display text-2xl font-bold">{loading ? "–" : value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 overflow-hidden p-0 animate-fade-up" style={{ animationDelay: "350ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-5">
          <h3 className="font-display text-lg font-semibold">All users</h3>
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/15"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <FiUsers className="size-10 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const isMe = u.id === me?.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-t border-white/5 transition-colors hover:bg-white/[0.03] animate-fade-up"
                      style={{ animationDelay: `${400 + i * 50}ms` }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} className="size-9 text-xs" />
                          <div className="min-w-0">
                            <p className="font-medium text-white">
                              {u.name} {isMe && <span className="ml-1 text-xs text-violet-300">(you)</span>}
                            </p>
                            <p className="truncate text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {busyId === u.id ? (
                            <Spinner className="size-5 text-violet-300" />
                          ) : isMe ? (
                            <span className="text-xs text-slate-600">—</span>
                          ) : confirmId === u.id ? (
                            <div className="flex items-center gap-2 animate-fade-in">
                              <span className="text-xs text-slate-400">Delete?</span>
                              <button onClick={() => deleteUser(u)} className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/30">
                                Yes
                              </button>
                              <button onClick={() => setConfirmId(null)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleRole(u)}
                                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200"
                              >
                                Make {u.role === "admin" ? "user" : "admin"}
                              </button>
                              <button
                                onClick={() => setConfirmId(u.id)}
                                title="Delete user"
                                className="grid size-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
                              >
                                <FiTrash2 className="size-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
};

export default Admin;
