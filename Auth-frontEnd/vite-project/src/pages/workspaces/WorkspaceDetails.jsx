import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiFolder,
  FiHash,
  FiLayers,
  FiSave,
  FiTrash2,
  FiType,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import AppShell from "../../components/AppShell";
import { Avatar, Button, Card, Input } from "../../components/ui";
import { TextArea, WorkspaceAvatar, WorkspaceRoleBadge } from "../../components/workspace";
import { useAuth } from "../../auth/Auth-context";
import { useWorkspaces } from "../../workspace/WorkspaceContext";
import { SLUG_PATTERN } from "../../workspace/slug";
import { apiError, deleteWorkspace, getWorkspace, updateWorkspace } from "../../api/workspaces";
import InvitationsPanel from "./InvitationsPanel";

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const SettingsForm = ({ workspace, canEdit, onSaved }) => {
  const [form, setForm] = useState({
    name: workspace.name,
    slug: workspace.slug,
    description: workspace.description || "",
  });
  const [saving, setSaving] = useState(false);

  const dirty =
    form.name.trim() !== workspace.name ||
    form.slug.trim() !== workspace.slug ||
    form.description.trim() !== (workspace.description || "");

  const submit = async (e) => {
    e.preventDefault();
    const payload = {};
    if (form.name.trim() !== workspace.name) payload.name = form.name.trim();
    if (form.slug.trim() !== workspace.slug) payload.slug = form.slug.trim();
    if (form.description.trim() !== (workspace.description || "")) payload.description = form.description.trim();
    setSaving(true);
    try {
      const updated = await updateWorkspace(workspace.id, payload);
      toast.success("Workspace settings saved");
      onSaved(updated);
    } catch (error) {
      toast.error(apiError(error, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-7 animate-fade-up" style={{ animationDelay: "150ms" }}>
      <h2 className="font-display text-lg font-semibold">Settings</h2>
      <p className="mt-1 text-sm text-slate-400">
        {canEdit ? "Owners and admins can change these." : "Only owners and admins can change workspace settings."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <fieldset disabled={!canEdit} className="space-y-5 disabled:opacity-70">
          <Input
            label="Name"
            icon={FiType}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            minLength={2}
            maxLength={80}
            required
          />
          <Input
            label="URL slug"
            icon={FiHash}
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
            pattern={SLUG_PATTERN}
            title="Lowercase letters, numbers and single dashes"
            minLength={3}
            maxLength={60}
            required
          />
          <TextArea
            label="Description"
            hint={`${form.description.length}/500`}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={500}
            placeholder="What is this workspace for?"
          />
        </fieldset>
        {canEdit && (
          <div className="flex justify-end">
            <Button type="submit" loading={saving} loadingText="Saving..." disabled={!dirty}>
              <FiSave /> Save changes
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
};

const DangerZone = ({ workspace, onDeleted }) => {
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const remove = async (e) => {
    e.preventDefault();
    setDeleting(true);
    try {
      await deleteWorkspace(workspace.id, confirm);
      toast.success(`Workspace "${workspace.name}" deleted`);
      onDeleted();
    } catch (error) {
      toast.error(apiError(error, "Could not delete workspace"));
      setDeleting(false);
    }
  };

  return (
    <Card className="border-rose-500/20 p-7 animate-fade-up" style={{ animationDelay: "250ms" }}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-rose-500/10 text-rose-300">
          <FiAlertTriangle className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold">Delete workspace</h2>
          <p className="text-sm text-slate-400">This permanently removes the workspace and all memberships.</p>
        </div>
      </div>
      <form onSubmit={remove} className="mt-5 space-y-4">
        <Input
          label={
            <>
              Type <span className="font-semibold text-white">{workspace.name}</span> to confirm
            </>
          }
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={workspace.name}
          autoComplete="off"
        />
        <Button type="submit" variant="danger" className="w-full" loading={deleting} loadingText="Deleting..." disabled={confirm !== workspace.name}>
          <FiTrash2 /> Delete this workspace
        </Button>
      </form>
    </Card>
  );
};

const WorkspaceDetails = ({ workspaceId }) => {
  const { user } = useAuth();
  const { selectWorkspace, upsertWorkspace, removeWorkspace } = useWorkspaces();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWorkspace(workspaceId)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        selectWorkspace(res.workspace.id);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error.response?.status === 404) setNotFound(true);
        else toast.error(apiError(error, "Could not load workspace"));
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, selectWorkspace]);

  if (notFound) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-md p-10 text-center animate-scale-in">
          <FiAlertTriangle className="mx-auto size-10 text-amber-300" />
          <h1 className="mt-4 font-display text-2xl font-bold">Workspace not found</h1>
          <p className="mt-2 text-sm text-slate-400">It doesn’t exist or you’re not a member of it.</p>
          <Link to="/workspaces" className="mt-6 inline-block">
            <Button variant="ghost">
              <FiArrowLeft /> All workspaces
            </Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="skeleton h-36 rounded-3xl" />
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="skeleton h-80 rounded-3xl lg:col-span-2" />
          <div className="skeleton h-80 rounded-3xl lg:col-span-3" />
        </div>
      </AppShell>
    );
  }

  const { workspace, members } = data;
  const canEdit = ["owner", "admin"].includes(workspace.role);
  const isOwner = workspace.role === "owner";

  const onSaved = (updated) => {
    setData({ ...data, workspace: { ...workspace, ...updated } });
    upsertWorkspace(updated);
  };

  const onDeleted = () => {
    removeWorkspace(workspace.id);
    navigate("/workspaces");
  };

  return (
    <AppShell>
      <Link to="/workspaces" className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white">
        <FiArrowLeft /> All workspaces
      </Link>

      <section className="relative mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-cyan-500/10 p-7 animate-fade-up sm:p-9">
        <div className="absolute -right-10 -top-10 size-56 rounded-full bg-violet-500/25 blur-3xl animate-blob" />
        <div className="relative flex flex-wrap items-center gap-5">
          <WorkspaceAvatar name={workspace.name} className="size-16 rounded-2xl text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate font-display text-3xl font-bold">{workspace.name}</h1>
              <WorkspaceRoleBadge role={workspace.role} />
            </div>
            <p className="mt-1 font-mono text-sm text-slate-400">/{workspace.slug}</p>
            {workspace.description && <p className="mt-3 max-w-2xl text-slate-300">{workspace.description}</p>}
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-6 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <FiUsers /> {workspace.memberCount} member{workspace.memberCount === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-2">
            <FiCalendar /> Created {fmtDate(workspace.createdAt)}
          </span>
          <div className="flex gap-2 sm:ml-auto">
            <Link
              to={`/workspaces/${workspace.id}/projects`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 font-medium text-white transition hover:border-violet-400/50 hover:bg-violet-500/15"
            >
              <FiFolder /> Projects
            </Link>
            <Link
              to={`/workspaces/${workspace.id}/teams`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 font-medium text-white transition hover:border-violet-400/50 hover:bg-violet-500/15"
            >
              <FiLayers /> Teams
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-7 animate-fade-up lg:col-span-2" style={{ animationDelay: "100ms" }}>
          <h2 className="font-display text-lg font-semibold">Members</h2>
          <p className="mt-1 text-sm text-slate-400">People with access to this workspace.</p>
          <ul className="mt-5 divide-y divide-white/5">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <Avatar name={m.name} className="size-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {m.name}
                    {m.userId === user?.id && <span className="ml-1.5 text-xs text-violet-300">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">{m.email}</p>
                </div>
                <WorkspaceRoleBadge role={m.role} />
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <SettingsForm key={workspace.updatedAt} workspace={workspace} canEdit={canEdit} onSaved={onSaved} />
          {canEdit && <InvitationsPanel workspace={workspace} />}
          {isOwner && <DangerZone workspace={workspace} onDeleted={onDeleted} />}
        </div>
      </div>
    </AppShell>
  );
};

// workspace badalne par (switcher) component remount ho - purana data/state reset
const WorkspaceDetailsRoute = () => {
  const { workspaceId } = useParams();
  return <WorkspaceDetails key={workspaceId} workspaceId={workspaceId} />;
};

export default WorkspaceDetailsRoute;
