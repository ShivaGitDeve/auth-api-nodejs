import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowRight, FiHash, FiLayers, FiPlus, FiType, FiUsers, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import AppShell from "../../components/AppShell";
import { Button, Card, Input } from "../../components/ui";
import { TextArea, WorkspaceAvatar, WorkspaceRoleBadge } from "../../components/workspace";
import { useWorkspaces } from "../../workspace/WorkspaceContext";
import { SLUG_PATTERN, toSlug } from "../../workspace/slug";
import { apiError, createWorkspace } from "../../api/workspaces";

const CreateWorkspaceForm = ({ onCancel, onCreated }) => {
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name: form.name.trim() };
      if (form.slug.trim()) payload.slug = form.slug.trim();
      if (form.description.trim()) payload.description = form.description.trim();
      const ws = await createWorkspace(payload);
      toast.success(`Workspace "${ws.name}" created`);
      onCreated(ws);
    } catch (error) {
      toast.error(apiError(error, "Could not create workspace"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 animate-scale-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Create a workspace</h2>
          <p className="mt-1 text-sm text-slate-400">A workspace keeps one organization’s people and data together.</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white" aria-label="Close">
            <FiX className="size-5" />
          </button>
        )}
      </div>
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Workspace name"
          hint="2–80 characters"
          icon={FiType}
          name="name"
          placeholder="Acme Inc"
          value={form.name}
          onChange={change}
          minLength={2}
          maxLength={80}
          required
          autoFocus
        />
        <Input
          label="URL slug (optional)"
          hint={form.slug ? "" : form.name ? `auto: ${toSlug(form.name) || "workspace"}` : "auto from name"}
          icon={FiHash}
          name="slug"
          placeholder="acme-inc"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
          pattern={SLUG_PATTERN}
          title="Lowercase letters, numbers and single dashes"
          minLength={3}
          maxLength={60}
        />
        <div className="sm:col-span-2">
          <TextArea
            label="Description (optional)"
            hint={`${form.description.length}/500`}
            name="description"
            placeholder="What is this workspace for?"
            value={form.description}
            onChange={change}
            maxLength={500}
          />
        </div>
        <div className="flex justify-end gap-3 sm:col-span-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={loading} loadingText="Creating...">
            <FiPlus /> Create workspace
          </Button>
        </div>
      </form>
    </Card>
  );
};

const Workspaces = () => {
  const { workspaces, current, loading, selectWorkspace, upsertWorkspace } = useWorkspaces();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const navigate = useNavigate();

  // switcher ka "New workspace" link ?new=1 ke saath aata hai
  const showForm = formOpen || searchParams.get("new") === "1";

  const closeForm = () => {
    setFormOpen(false);
    if (searchParams.has("new")) setSearchParams({}, { replace: true });
  };

  const open = (ws) => {
    selectWorkspace(ws.id);
    navigate(`/workspaces/${ws.id}`);
  };

  const onCreated = (ws) => {
    upsertWorkspace(ws);
    setFormOpen(false);
    open(ws);
  };

  const empty = !loading && workspaces.length === 0;

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-sm font-medium text-violet-300">TeamFlow</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Workspaces</h1>
          <p className="mt-2 text-slate-400">Switch between organizations or create a new one.</p>
        </div>
        {!showForm && !empty && (
          <Button onClick={() => setFormOpen(true)}>
            <FiPlus /> New workspace
          </Button>
        )}
      </div>

      {(showForm || empty) && (
        <div className="mt-8">
          <CreateWorkspaceForm onCancel={empty ? null : closeForm} onCreated={onCreated} />
        </div>
      )}

      {loading && workspaces.length === 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-40 rounded-3xl" />
          ))}
        </div>
      ) : empty ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-500 animate-fade-in">
          <FiLayers /> You’re not a member of any workspace yet — create your first one above.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws, i) => (
            <button
              key={ws.id}
              onClick={() => open(ws)}
              className="text-left animate-fade-up"
              style={{ animationDelay: `${100 + i * 60}ms` }}
            >
              <Card
                className={`group h-full p-6 transition-all duration-500 hover:-translate-y-1 hover:border-violet-400/40 ${
                  ws.id === current?.id ? "border-violet-400/40 ring-1 ring-violet-500/30" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <WorkspaceAvatar name={ws.name} className="size-12 rounded-xl text-base" />
                  <div className="flex flex-col items-end gap-1.5">
                    <WorkspaceRoleBadge role={ws.role} />
                    {ws.id === current?.id && (
                      <span className="text-[11px] font-medium text-violet-300">Current</span>
                    )}
                  </div>
                </div>
                <h3 className="mt-5 truncate font-display text-lg font-semibold">{ws.name}</h3>
                <p className="truncate font-mono text-xs text-slate-500">/{ws.slug}</p>
                {ws.description && <p className="mt-3 line-clamp-2 text-sm text-slate-400">{ws.description}</p>}
                <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <FiUsers className="size-4" /> {ws.memberCount} member{ws.memberCount === 1 ? "" : "s"}
                  </span>
                  <FiArrowRight className="size-4 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-white" />
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default Workspaces;
