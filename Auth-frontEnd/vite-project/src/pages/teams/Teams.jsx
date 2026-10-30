import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiAlertTriangle, FiArrowLeft, FiArrowRight, FiPlus, FiType, FiUsers, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import AppShell from "../../components/AppShell";
import { Button, Card, Input } from "../../components/ui";
import { TextArea, WorkspaceAvatar, WorkspaceRoleBadge } from "../../components/workspace";
import { useWorkspaces } from "../../workspace/WorkspaceContext";
import { apiError, getWorkspace } from "../../api/workspaces";
import { createTeam, listTeams } from "../../api/teams";

const CreateTeamForm = ({ workspaceId, onCancel, onCreated }) => {
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name.trim() };
      if (form.description.trim()) payload.description = form.description.trim();
      const team = await createTeam(workspaceId, payload);
      toast.success(`Team "${team.name}" created`);
      onCreated(team);
    } catch (error) {
      toast.error(apiError(error, "Could not create team"));
      setSaving(false);
    }
  };

  return (
    <Card className="p-7 animate-scale-in">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Create a team</h2>
          <p className="mt-1 text-sm text-slate-400">Group workspace members by function, project area or squad.</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white" aria-label="Close">
            <FiX className="size-5" />
          </button>
        )}
      </div>
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Team name"
          hint="2–80 characters, unique in this workspace"
          icon={FiType}
          placeholder="Design"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          minLength={2}
          maxLength={80}
          required
          autoFocus
        />
        <TextArea
          label="Description (optional)"
          hint={`${form.description.length}/500`}
          placeholder="What does this team work on?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          maxLength={500}
        />
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={saving} loadingText="Creating...">
            <FiPlus /> Create team
          </Button>
        </div>
      </form>
    </Card>
  );
};

const Teams = ({ workspaceId }) => {
  const { selectWorkspace } = useWorkspaces();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWorkspace(workspaceId), listTeams(workspaceId)])
      .then(([ws, teams]) => {
        if (cancelled) return;
        setState({ workspace: ws.workspace, teams });
        selectWorkspace(ws.workspace.id);
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ error: apiError(error, "Could not load teams"), notFound: error.response?.status === 404 });
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, selectWorkspace]);

  if (state.error) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-md p-10 text-center animate-scale-in">
          <FiAlertTriangle className="mx-auto size-10 text-amber-300" />
          <h1 className="mt-4 font-display text-2xl font-bold">{state.notFound ? "Workspace not found" : "Something went wrong"}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {state.notFound ? "It doesn’t exist or you’re not a member of it." : state.error}
          </p>
          <Link to="/workspaces" className="mt-6 inline-block">
            <Button variant="ghost">
              <FiArrowLeft /> All workspaces
            </Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  const { workspace, teams } = state;
  const canManage = workspace && ["owner", "admin"].includes(workspace.role);

  const onCreated = (team) => navigate(`/workspaces/${workspaceId}/teams/${team.id}`);

  return (
    <AppShell>
      <Link to={`/workspaces/${workspaceId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white">
        <FiArrowLeft /> {workspace ? workspace.name : "Workspace"}
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-violet-300">
            {workspace?.name} {workspace && <WorkspaceRoleBadge role={workspace.role} />}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Teams</h1>
          <p className="mt-2 text-slate-400">Groups of people inside this workspace.</p>
        </div>
        {canManage && !showForm && teams?.length > 0 && (
          <Button onClick={() => setShowForm(true)}>
            <FiPlus /> New team
          </Button>
        )}
      </div>

      {canManage && (showForm || teams?.length === 0) && (
        <div className="mt-8">
          <CreateTeamForm
            workspaceId={workspaceId}
            onCancel={teams.length ? () => setShowForm(false) : null}
            onCreated={onCreated}
          />
        </div>
      )}

      {state.loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-40 rounded-3xl" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        !canManage && (
          <Card className="mt-8 flex flex-col items-center p-12 text-center animate-fade-in">
            <FiUsers className="size-10 text-slate-600" />
            <p className="mt-3 font-medium">No teams yet</p>
            <p className="mt-1 text-sm text-slate-500">Owners and admins of this workspace can create teams.</p>
          </Card>
        )
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team, i) => (
            <Link
              key={team.id}
              to={`/workspaces/${workspaceId}/teams/${team.id}`}
              className="animate-fade-up"
              style={{ animationDelay: `${80 + i * 50}ms` }}
            >
              <Card className="group h-full p-6 transition-all duration-500 hover:-translate-y-1 hover:border-violet-400/40">
                <div className="flex items-start justify-between gap-3">
                  <WorkspaceAvatar name={team.name} className="size-11 rounded-xl text-sm" />
                  {team.isMember && (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                      Your team
                    </span>
                  )}
                </div>
                <h3 className="mt-4 truncate font-display text-lg font-semibold">{team.name}</h3>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-400">{team.description || "No description"}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <FiUsers className="size-4" /> {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
                  </span>
                  <FiArrowRight className="size-4 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-white" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
};

// workspace badalne par state reset
const TeamsRoute = () => {
  const { workspaceId } = useParams();
  return <Teams key={workspaceId} workspaceId={workspaceId} />;
};

export default TeamsRoute;
