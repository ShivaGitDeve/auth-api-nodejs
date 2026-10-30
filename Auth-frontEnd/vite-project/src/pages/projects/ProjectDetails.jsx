import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArchive,
  FiArrowLeft,
  FiAward,
  FiCalendar,
  FiEdit3,
  FiRotateCcw,
  FiTrash2,
  FiUserMinus,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import AppShell from "../../components/AppShell";
import { Avatar, Button, Card, Input, Spinner } from "../../components/ui";
import { WorkspaceRoleBadge } from "../../components/workspace";
import { PriorityBadge, ProjectKey, SelectField, StatusBadge } from "../../components/project";
import { useAuth } from "../../auth/Auth-context";
import { useWorkspaces } from "../../workspace/WorkspaceContext";
import { apiError, getWorkspace } from "../../api/workspaces";
import { listTeams } from "../../api/teams";
import {
  addProjectMember,
  archiveProject,
  deleteProject,
  getProject,
  removeProjectMember,
  unarchiveProject,
  updateProject,
} from "../../api/projects";
import { EDITABLE_STATUSES, PRIORITIES, PRIORITY, STATUS, formatDate, isOverdue } from "../../project/projectMeta";
import ProjectForm from "./ProjectForm";

const Detail = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className="min-w-0 truncate text-right text-sm text-white">{children}</dd>
  </div>
);

const ProjectDetails = ({ workspaceId, projectId }) => {
  const { user } = useAuth();
  const { selectWorkspace } = useWorkspaces();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(null); // kaunsa action chal raha hai
  const [addUserId, setAddUserId] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState("active");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const loadProject = useCallback(
    () => getProject(workspaceId, projectId).then((data) => setState((s) => ({ ...s, project: data.project, members: data.members }))),
    [workspaceId, projectId],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWorkspace(workspaceId), getProject(workspaceId, projectId), listTeams(workspaceId)])
      .then(([ws, data, teams]) => {
        if (cancelled) return;
        setState({ workspace: ws.workspace, workspaceMembers: ws.members, teams, project: data.project, members: data.members });
        selectWorkspace(ws.workspace.id);
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ error: apiError(error, "Could not load project"), notFound: error.response?.status === 404 });
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, projectId, selectWorkspace]);

  // ek helper: action chalao, toast dikhao, busy state sambhalo
  const run = async (name, fn, success) => {
    setBusy(name);
    try {
      const result = await fn();
      if (success) toast.success(typeof success === "function" ? success(result) : success);
      return result;
    } catch (error) {
      toast.error(apiError(error, "Something went wrong"));
      return undefined;
    } finally {
      setBusy(null);
    }
  };

  if (state.error) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-md p-10 text-center animate-scale-in">
          <FiAlertTriangle className="mx-auto size-10 text-amber-300" />
          <h1 className="mt-4 font-display text-2xl font-bold">{state.notFound ? "Project not found" : "Something went wrong"}</h1>
          <p className="mt-2 text-sm text-slate-400">{state.notFound ? "It doesn’t exist or you don’t have access to it." : state.error}</p>
          <Link to={`/workspaces/${workspaceId}/projects`} className="mt-6 inline-block">
            <Button variant="ghost">
              <FiArrowLeft /> Back to projects
            </Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  if (state.loading) {
    return (
      <AppShell>
        <div className="skeleton h-44 rounded-3xl" />
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="skeleton h-96 rounded-3xl lg:col-span-3" />
          <div className="skeleton h-96 rounded-3xl lg:col-span-2" />
        </div>
      </AppShell>
    );
  }

  const { workspace, workspaceMembers, teams, project, members } = state;
  const archived = Boolean(project.archivedAt);
  const { canManage, canAdminister } = project.permissions;
  const editable = canManage && !archived;
  const inProject = new Set(members.map((m) => m.userId));
  const candidates = workspaceMembers.filter((m) => !inProject.has(m.userId));
  const ownerCandidates = workspaceMembers.filter((m) => m.userId !== project.owner?.userId);
  const overdue = isOverdue(project);

  const applyProject = (updated) => setState((s) => ({ ...s, project: { ...s.project, ...updated } }));

  const quickUpdate = (field) => async (e) => {
    const value = e.target.value;
    const updated = await run(field, () => updateProject(workspaceId, project.id, { [field]: value }), `${field === "status" ? "Status" : "Priority"} updated`);
    if (updated) applyProject(updated);
  };

  const saveEdit = async (payload) => {
    const updated = await run("edit", () => updateProject(workspaceId, project.id, payload), "Project updated");
    if (updated) {
      applyProject(updated);
      setEditing(false);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    const member = await run("add", () => addProjectMember(workspaceId, project.id, addUserId), (m) => `${m.name} added to the project`);
    if (member) {
      setState((s) => ({ ...s, members: [...s.members, member] }));
      setAddUserId("");
    }
  };

  const removeMember = async (member) => {
    const ok = await run(`remove-${member.userId}`, () => removeProjectMember(workspaceId, project.id, member.userId), `${member.name} removed`);
    if (ok) setState((s) => ({ ...s, members: s.members.filter((m) => m.userId !== member.userId) }));
    setConfirmRemove(null);
  };

  const transferOwner = async (e) => {
    e.preventDefault();
    const updated = await run("owner", () => updateProject(workspaceId, project.id, { ownerUserId: newOwnerId }), (p) => `${p.owner?.name} is now the project owner`);
    if (updated) {
      setNewOwnerId("");
      await loadProject().catch(() => {});
    }
  };

  const archive = async () => {
    const updated = await run("archive", () => archiveProject(workspaceId, project.id), "Project archived");
    if (updated) applyProject(updated);
    setConfirmArchive(false);
  };

  const unarchive = async () => {
    const updated = await run("unarchive", () => unarchiveProject(workspaceId, project.id, restoreStatus), "Project restored");
    if (updated) applyProject(updated);
  };

  const remove = async (e) => {
    e.preventDefault();
    const ok = await run("delete", () => deleteProject(workspaceId, project.id, deleteConfirm), `Project ${project.key} deleted`);
    if (ok) navigate(`/workspaces/${workspaceId}/projects`);
  };

  return (
    <AppShell>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
        <Link to={`/workspaces/${workspaceId}`} className="transition hover:text-white">
          {workspace.name}
        </Link>
        <span className="text-slate-600">/</span>
        <Link to={`/workspaces/${workspaceId}/projects`} className="transition hover:text-white">
          Projects
        </Link>
        <span className="text-slate-600">/</span>
        <span className="font-mono text-slate-300">{project.key}</span>
      </nav>

      {archived && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-400/20 bg-white/[0.04] px-5 py-3 text-sm text-slate-300 animate-fade-in">
          <FiArchive className="size-4 shrink-0" />
          This project was archived on {new Date(project.archivedAt).toLocaleDateString("en-IN")} and is read-only.
        </div>
      )}

      <section className="relative mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-cyan-500/10 p-7 animate-fade-up sm:p-9">
        <div className="absolute -right-10 -top-10 size-56 rounded-full bg-violet-500/25 blur-3xl animate-blob" />
        <div className="relative flex flex-wrap items-center gap-3">
          <ProjectKey value={project.key} className="text-xs" />
          <StatusBadge status={project.status} />
          <PriorityBadge priority={project.priority} />
          {project.isMember && <span className="text-xs text-emerald-300">You’re a member</span>}
        </div>
        <h1 className="relative mt-4 font-display text-3xl font-bold sm:text-4xl">{project.name}</h1>

        {editable && (
          <div className="relative mt-6 grid max-w-md grid-cols-2 gap-3">
            <SelectField label="Status" value={project.status} onChange={quickUpdate("status")} disabled={busy === "status"}>
              {EDITABLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS[s].label}
                </option>
              ))}
            </SelectField>
            <SelectField label="Priority" value={project.priority} onChange={quickUpdate("priority")} disabled={busy === "priority"}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY[p].label}
                </option>
              ))}
            </SelectField>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-7 animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">Overview</h2>
              {editable && !editing && (
                <Button variant="ghost" className="px-3 py-2" onClick={() => setEditing(true)}>
                  <FiEdit3 /> Edit
                </Button>
              )}
            </div>
            {editing ? (
              <div className="mt-5 animate-fade-in">
                <ProjectForm initial={project} teams={teams} onSubmit={saveEdit} onCancel={() => setEditing(false)} submitLabel="Save changes" />
              </div>
            ) : (
              <>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                  {project.description || <span className="text-slate-500">No description yet.</span>}
                </p>
                <dl className="mt-5">
                  <Detail label="Owner">{project.owner ? `${project.owner.name}` : <span className="text-slate-500">No owner</span>}</Detail>
                  <Detail label="Team">{project.team ? project.team.name : <span className="text-slate-500">No team</span>}</Detail>
                  <Detail label="Start date">{formatDate(project.startDate) || <span className="text-slate-500">—</span>}</Detail>
                  <Detail label="Due date">
                    {project.dueDate ? (
                      <span className={overdue ? "font-medium text-rose-300" : ""}>
                        {formatDate(project.dueDate)}
                        {overdue && " · overdue"}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </Detail>
                  <Detail label="Created">{new Date(project.createdAt).toLocaleDateString("en-IN")}</Detail>
                </dl>
              </>
            )}
          </Card>

          <Card className="p-7 animate-fade-up" style={{ animationDelay: "140ms" }}>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <FiUsers /> Members <span className="text-sm font-normal text-slate-500">({members.length})</span>
            </h2>

            {editable && (
              <form onSubmit={addMember} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <select
                  value={addUserId}
                  onChange={(e) => setAddUserId(e.target.value)}
                  disabled={candidates.length === 0}
                  aria-label="Workspace member to add"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none transition focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/15 disabled:opacity-60 [&>option]:bg-[#0d0d1c]"
                >
                  <option value="">{candidates.length ? "Choose a workspace member…" : "Everyone in the workspace is already a member"}</option>
                  {candidates.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
                <Button type="submit" loading={busy === "add"} loadingText="Adding..." disabled={!addUserId}>
                  <FiUserPlus /> Add
                </Button>
              </form>
            )}

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
                  {m.isOwner && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                      <FiAward className="size-3" /> Project owner
                    </span>
                  )}
                  <WorkspaceRoleBadge role={m.workspaceRole} />
                  {editable &&
                    !m.isOwner &&
                    (busy === `remove-${m.userId}` ? (
                      <Spinner className="size-5 text-violet-300" />
                    ) : confirmRemove === m.userId ? (
                      <span className="flex items-center gap-2 animate-fade-in">
                        <button onClick={() => removeMember(m)} className="rounded-lg bg-rose-500/20 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/30">
                          Remove
                        </button>
                        <button onClick={() => setConfirmRemove(null)} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10">
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(m.userId)}
                        title="Remove from project"
                        className="grid size-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <FiUserMinus className="size-3.5" />
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {!canManage && (
            <Card className="p-7 animate-fade-up" style={{ animationDelay: "120ms" }}>
              <h2 className="font-display text-lg font-semibold">View only</h2>
              <p className="mt-2 text-sm text-slate-400">
                Only the project owner or workspace owners/admins can change this project or its members.
              </p>
            </Card>
          )}

          {canAdminister && !archived && (
            <Card className="p-7 animate-fade-up" style={{ animationDelay: "160ms" }}>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <FiAward /> Project owner
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Current: <span className="text-white">{project.owner?.name || "nobody"}</span>. The owner can edit the project and manage its members.
              </p>
              <form onSubmit={transferOwner} className="mt-4 space-y-3">
                <SelectField value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)} aria-label="New project owner">
                  <option value="">Choose a workspace member…</option>
                  {ownerCandidates.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </SelectField>
                <Button type="submit" variant="ghost" className="w-full" loading={busy === "owner"} loadingText="Transferring..." disabled={!newOwnerId}>
                  Transfer ownership
                </Button>
              </form>
            </Card>
          )}

          {canManage && (
            <Card className="p-7 animate-fade-up" style={{ animationDelay: "200ms" }}>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <FiArchive /> {archived ? "Restore project" : "Archive project"}
              </h2>
              {archived ? (
                <div className="mt-4 space-y-3">
                  <SelectField label="Restore with status" value={restoreStatus} onChange={(e) => setRestoreStatus(e.target.value)}>
                    {EDITABLE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS[s].label}
                      </option>
                    ))}
                  </SelectField>
                  <Button className="w-full" onClick={unarchive} loading={busy === "unarchive"} loadingText="Restoring...">
                    <FiRotateCcw /> Unarchive
                  </Button>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-sm text-slate-400">Hides it from the default list and makes it read-only. You can restore it any time.</p>
                  {confirmArchive ? (
                    <div className="mt-4 flex flex-wrap gap-3 animate-fade-in">
                      <Button onClick={archive} loading={busy === "archive"} loadingText="Archiving...">
                        <FiArchive /> Yes, archive
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirmArchive(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" className="mt-4 w-full" onClick={() => setConfirmArchive(true)}>
                      <FiArchive /> Archive project
                    </Button>
                  )}
                </>
              )}
            </Card>
          )}

          {canAdminister && (
            <Card className="border-rose-500/20 p-7 animate-fade-up" style={{ animationDelay: "240ms" }}>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <FiTrash2 /> Delete project
              </h2>
              <p className="mt-1 text-sm text-slate-400">Permanently removes the project and its member list.</p>
              <form onSubmit={remove} className="mt-4 space-y-3">
                <Input
                  label={
                    <>
                      Type <span className="font-mono font-semibold text-white">{project.key}</span> to confirm
                    </>
                  }
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                  placeholder={project.key}
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  variant="danger"
                  className="w-full"
                  loading={busy === "delete"}
                  loadingText="Deleting..."
                  disabled={deleteConfirm !== project.key}
                >
                  <FiTrash2 /> Delete permanently
                </Button>
              </form>
            </Card>
          )}

          <Card className="p-5 text-xs text-slate-500 animate-fade-up" style={{ animationDelay: "280ms" }}>
            <FiCalendar className="mb-2 size-4" />
            Last updated {new Date(project.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

const ProjectDetailsRoute = () => {
  const { workspaceId, projectId } = useParams();
  return <ProjectDetails key={`${workspaceId}/${projectId}`} workspaceId={workspaceId} projectId={projectId} />;
};

export default ProjectDetailsRoute;
