import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiSave,
  FiTrash2,
  FiType,
  FiUserMinus,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import AppShell from "../../components/AppShell";
import { Avatar, Button, Card, Input, Spinner } from "../../components/ui";
import { TextArea, WorkspaceAvatar, WorkspaceRoleBadge } from "../../components/workspace";
import { useAuth } from "../../auth/Auth-context";
import { useWorkspaces } from "../../workspace/WorkspaceContext";
import { apiError, getWorkspace } from "../../api/workspaces";
import { addTeamMember, deleteTeam, getTeam, removeTeamMember, updateTeam } from "../../api/teams";

const EditTeamForm = ({ workspaceId, team, onSaved }) => {
  const [form, setForm] = useState({ name: team.name, description: team.description || "" });
  const [saving, setSaving] = useState(false);
  const dirty = form.name.trim() !== team.name || form.description.trim() !== (team.description || "");

  const submit = async (e) => {
    e.preventDefault();
    const payload = {};
    if (form.name.trim() !== team.name) payload.name = form.name.trim();
    if (form.description.trim() !== (team.description || "")) payload.description = form.description.trim();
    setSaving(true);
    try {
      const updated = await updateTeam(workspaceId, team.id, payload);
      toast.success("Team updated");
      onSaved(updated);
    } catch (error) {
      toast.error(apiError(error, "Could not update team"));
      setSaving(false);
    }
  };

  return (
    <Card className="p-7 animate-fade-up" style={{ animationDelay: "150ms" }}>
      <h2 className="font-display text-lg font-semibold">Team settings</h2>
      <form onSubmit={submit} className="mt-5 space-y-5">
        <Input
          label="Name"
          icon={FiType}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          minLength={2}
          maxLength={80}
          required
        />
        <TextArea
          label="Description"
          hint={`${form.description.length}/500`}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          maxLength={500}
          placeholder="What does this team work on?"
        />
        <div className="flex justify-end">
          <Button type="submit" loading={saving} loadingText="Saving..." disabled={!dirty}>
            <FiSave /> Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
};

const DeleteTeam = ({ workspaceId, team, onDeleted }) => {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteTeam(workspaceId, team.id);
      toast.success(`Team "${team.name}" deleted`);
      onDeleted();
    } catch (error) {
      toast.error(apiError(error, "Could not delete team"));
      setDeleting(false);
    }
  };

  return (
    <Card className="border-rose-500/20 p-7 animate-fade-up" style={{ animationDelay: "250ms" }}>
      <h2 className="font-display text-lg font-semibold">Delete team</h2>
      <p className="mt-1 text-sm text-slate-400">Removes the team and its member list. People stay in the workspace.</p>
      {confirming ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 animate-fade-in">
          <span className="text-sm text-rose-200">Delete “{team.name}”?</span>
          <Button variant="danger" onClick={remove} loading={deleting} loadingText="Deleting...">
            <FiTrash2 /> Yes, delete
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)} disabled={deleting}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="danger" className="mt-5" onClick={() => setConfirming(true)}>
          <FiTrash2 /> Delete team
        </Button>
      )}
    </Card>
  );
};

const TeamDetails = ({ workspaceId, teamId }) => {
  const { user } = useAuth();
  const { selectWorkspace } = useWorkspaces();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [confirmUserId, setConfirmUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWorkspace(workspaceId), getTeam(workspaceId, teamId)])
      .then(([ws, teamData]) => {
        if (cancelled) return;
        setState({ workspace: ws.workspace, workspaceMembers: ws.members, team: teamData.team, members: teamData.members });
        selectWorkspace(ws.workspace.id);
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ error: apiError(error, "Could not load team"), notFound: error.response?.status === 404 });
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, teamId, selectWorkspace]);

  if (state.error) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-md p-10 text-center animate-scale-in">
          <FiAlertTriangle className="mx-auto size-10 text-amber-300" />
          <h1 className="mt-4 font-display text-2xl font-bold">{state.notFound ? "Team not found" : "Something went wrong"}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {state.notFound ? "It doesn’t exist or you don’t have access to it." : state.error}
          </p>
          <Link to={`/workspaces/${workspaceId}/teams`} className="mt-6 inline-block">
            <Button variant="ghost">
              <FiArrowLeft /> Back to teams
            </Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  if (state.loading) {
    return (
      <AppShell>
        <div className="skeleton h-36 rounded-3xl" />
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="skeleton h-80 rounded-3xl lg:col-span-3" />
          <div className="skeleton h-80 rounded-3xl lg:col-span-2" />
        </div>
      </AppShell>
    );
  }

  const { workspace, workspaceMembers, team, members } = state;
  const canManage = ["owner", "admin"].includes(workspace.role);
  const inTeam = new Set(members.map((m) => m.userId));
  // sirf isi workspace ke members jo abhi team mein nahi hain
  const candidates = workspaceMembers.filter((m) => !inTeam.has(m.userId));

  const add = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setAdding(true);
    try {
      const member = await addTeamMember(workspaceId, team.id, selectedUserId);
      setState((s) => ({
        ...s,
        members: [...s.members, member],
        team: { ...s.team, memberCount: s.team.memberCount + 1 },
      }));
      setSelectedUserId("");
      toast.success(`${member.name} added to ${team.name}`);
    } catch (error) {
      toast.error(apiError(error, "Could not add member"));
    } finally {
      setAdding(false);
    }
  };

  const remove = async (member) => {
    setBusyUserId(member.userId);
    try {
      await removeTeamMember(workspaceId, team.id, member.userId);
      setState((s) => ({
        ...s,
        members: s.members.filter((m) => m.userId !== member.userId),
        team: { ...s.team, memberCount: s.team.memberCount - 1 },
      }));
      toast.success(`${member.name} removed from ${team.name}`);
    } catch (error) {
      toast.error(apiError(error, "Could not remove member"));
    } finally {
      setBusyUserId(null);
      setConfirmUserId(null);
    }
  };

  const onSaved = (updated) => setState((s) => ({ ...s, team: { ...s.team, ...updated } }));
  const onDeleted = () => navigate(`/workspaces/${workspaceId}/teams`);

  return (
    <AppShell>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
        <Link to={`/workspaces/${workspaceId}`} className="transition hover:text-white">
          {workspace.name}
        </Link>
        <span className="text-slate-600">/</span>
        <Link to={`/workspaces/${workspaceId}/teams`} className="transition hover:text-white">
          Teams
        </Link>
        <span className="text-slate-600">/</span>
        <span className="truncate text-slate-300">{team.name}</span>
      </nav>

      <section className="relative mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/15 via-violet-600/15 to-fuchsia-600/10 p-7 animate-fade-up sm:p-9">
        <div className="absolute -right-10 -top-10 size-56 rounded-full bg-cyan-400/20 blur-3xl animate-blob" />
        <div className="relative flex flex-wrap items-center gap-5">
          <WorkspaceAvatar name={team.name} className="size-16 rounded-2xl text-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-3xl font-bold">{team.name}</h1>
            {team.description && <p className="mt-2 max-w-2xl text-slate-300">{team.description}</p>}
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-5 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <FiUsers /> {members.length} member{members.length === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-2">
            Your workspace role <WorkspaceRoleBadge role={workspace.role} />
          </span>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-7 animate-fade-up lg:col-span-3" style={{ animationDelay: "100ms" }}>
          <h2 className="font-display text-lg font-semibold">Members</h2>

          {canManage && (
            <form onSubmit={add} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={candidates.length === 0}
                aria-label="Workspace member to add"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none transition focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/15 disabled:opacity-60 [&>option]:bg-[#0d0d1c]"
              >
                <option value="">
                  {candidates.length ? "Choose a workspace member…" : "Everyone in the workspace is already in this team"}
                </option>
                {candidates.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
              <Button type="submit" loading={adding} loadingText="Adding..." disabled={!selectedUserId}>
                <FiUserPlus /> Add
              </Button>
            </form>
          )}
          {canManage && workspaceMembers.length <= 1 && (
            <p className="mt-3 text-xs text-slate-500">
              Only you are in this workspace.{" "}
              <Link to={`/workspaces/${workspaceId}`} className="text-violet-300 hover:text-white">
                Invite people
              </Link>{" "}
              first, then add them here.
            </p>
          )}

          {members.length === 0 ? (
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-white/10 py-10 text-center">
              <FiUsers className="size-8 text-slate-600" />
              <p className="mt-2 text-sm text-slate-400">No one is in this team yet.</p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-white/5">
              {members.map((m) => (
                <li key={m.userId} className="flex flex-wrap items-center gap-3 py-3 animate-fade-in">
                  <Avatar name={m.name} className="size-9 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {m.name}
                      {m.userId === user?.id && <span className="ml-1.5 text-xs text-violet-300">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">{m.email}</p>
                  </div>
                  <WorkspaceRoleBadge role={m.workspaceRole} />
                  {canManage &&
                    (busyUserId === m.userId ? (
                      <Spinner className="size-5 text-violet-300" />
                    ) : confirmUserId === m.userId ? (
                      <span className="flex items-center gap-2 animate-fade-in">
                        <button onClick={() => remove(m)} className="rounded-lg bg-rose-500/20 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/30">
                          Remove
                        </button>
                        <button onClick={() => setConfirmUserId(null)} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10">
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmUserId(m.userId)}
                        title="Remove from team"
                        className="grid size-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <FiUserMinus className="size-3.5" />
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {canManage ? (
            <>
              <EditTeamForm key={team.updatedAt} workspaceId={workspaceId} team={team} onSaved={onSaved} />
              <DeleteTeam workspaceId={workspaceId} team={team} onDeleted={onDeleted} />
            </>
          ) : (
            <Card className="p-7 animate-fade-up" style={{ animationDelay: "150ms" }}>
              <h2 className="font-display text-lg font-semibold">About this team</h2>
              <p className="mt-2 text-sm text-slate-400">{team.description || "No description yet."}</p>
              <p className="mt-4 text-xs text-slate-500">Only workspace owners and admins can edit teams or change members.</p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
};

const TeamDetailsRoute = () => {
  const { workspaceId, teamId } = useParams();
  return <TeamDetails key={`${workspaceId}/${teamId}`} workspaceId={workspaceId} teamId={teamId} />;
};

export default TeamDetailsRoute;
