import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiAlertTriangle, FiArrowLeft, FiCalendar, FiFolder, FiPlus, FiSearch, FiUsers, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import AppShell from "../../components/AppShell";
import { Button, Card } from "../../components/ui";
import { WorkspaceRoleBadge } from "../../components/workspace";
import { PriorityBadge, ProjectKey, StatusBadge } from "../../components/project";
import { useWorkspaces } from "../../workspace/WorkspaceContext";
import { apiError, getWorkspace } from "../../api/workspaces";
import { listTeams } from "../../api/teams";
import { createProject, listProjects } from "../../api/projects";
import { STATUS, formatDate, isOverdue } from "../../project/projectMeta";
import ProjectForm from "./ProjectForm";

const FILTERS = [
  { id: "open", label: "All open" },
  { id: "planning", label: STATUS.planning.label },
  { id: "active", label: STATUS.active.label },
  { id: "on_hold", label: STATUS.on_hold.label },
  { id: "completed", label: STATUS.completed.label },
  { id: "archived", label: STATUS.archived.label },
];

const ProjectCard = ({ project, to, delay }) => {
  const overdue = isOverdue(project);
  return (
    <Link to={to} className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <Card className="group flex h-full flex-col p-6 transition-all duration-500 hover:-translate-y-1 hover:border-violet-400/40">
        <div className="flex items-start justify-between gap-3">
          <ProjectKey value={project.key} />
          <StatusBadge status={project.status} />
        </div>
        <h3 className="mt-4 line-clamp-2 font-display text-lg font-semibold leading-snug">{project.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{project.description || "No description"}</p>
        <div className="mt-auto space-y-3 pt-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
            <PriorityBadge priority={project.priority} />
            {project.dueDate && (
              <span className={`flex items-center gap-1 ${overdue ? "text-rose-300" : ""}`}>
                <FiCalendar className="size-3.5" /> {overdue ? "Overdue · " : "Due "}
                {formatDate(project.dueDate)}
              </span>
            )}
            {project.team && <span className="truncate">Team · {project.team.name}</span>}
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-500">
            <span className="truncate">{project.owner ? `Owner · ${project.owner.name}` : "No owner"}</span>
            <span className="flex shrink-0 items-center gap-1">
              <FiUsers className="size-3.5" /> {project.memberCount}
              {project.isMember && <span className="ml-1.5 text-emerald-300">· You</span>}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

const Projects = ({ workspaceId }) => {
  const { selectWorkspace } = useWorkspaces();
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null); // { workspace, teams }
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("open");
  const [results, setResults] = useState({}); // filter -> projects
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWorkspace(workspaceId), listTeams(workspaceId)])
      .then(([ws, teams]) => {
        if (cancelled) return;
        setMeta({ workspace: ws.workspace, teams });
        selectWorkspace(ws.workspace.id);
      })
      .catch((err) => !cancelled && setError({ message: apiError(err, "Could not load projects"), notFound: err.response?.status === 404 }));
    return () => {
      cancelled = true;
    };
  }, [workspaceId, selectWorkspace]);

  // har filter ka result alag cache - tab badalne par dobara loading flash nahi
  useEffect(() => {
    let cancelled = false;
    listProjects(workspaceId, filter === "open" ? {} : { status: filter })
      .then((list) => !cancelled && setResults((r) => ({ ...r, [filter]: list })))
      .catch((err) => !cancelled && setError({ message: apiError(err, "Could not load projects"), notFound: err.response?.status === 404 }));
    return () => {
      cancelled = true;
    };
  }, [workspaceId, filter]);

  const projects = results[filter];
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!projects || !q) return projects;
    return projects.filter((p) => `${p.name} ${p.key} ${p.team?.name || ""}`.toLowerCase().includes(q));
  }, [projects, query]);

  if (error) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-md p-10 text-center animate-scale-in">
          <FiAlertTriangle className="mx-auto size-10 text-amber-300" />
          <h1 className="mt-4 font-display text-2xl font-bold">{error.notFound ? "Workspace not found" : "Something went wrong"}</h1>
          <p className="mt-2 text-sm text-slate-400">{error.notFound ? "It doesn’t exist or you’re not a member of it." : error.message}</p>
          <Link to="/workspaces" className="mt-6 inline-block">
            <Button variant="ghost">
              <FiArrowLeft /> All workspaces
            </Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  const workspace = meta?.workspace;
  const canCreate = workspace && ["owner", "admin"].includes(workspace.role);

  const create = async (payload) => {
    try {
      const project = await createProject(workspaceId, payload);
      toast.success(`Project ${project.key} created`);
      navigate(`/workspaces/${workspaceId}/projects/${project.id}`);
    } catch (err) {
      toast.error(apiError(err, "Could not create project"));
    }
  };

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
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Projects</h1>
          <p className="mt-2 text-slate-400">Plan, track and organize work in this workspace.</p>
        </div>
        {canCreate && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <FiPlus /> New project
          </Button>
        )}
      </div>

      {canCreate && showForm && meta && (
        <Card className="mt-8 p-7 animate-scale-in">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Create a project</h2>
              <p className="mt-1 text-sm text-slate-400">You’ll become the project owner. You can add members afterwards.</p>
            </div>
            <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white" aria-label="Close">
              <FiX className="size-5" />
            </button>
          </div>
          <ProjectForm teams={meta.teams} onSubmit={create} onCancel={() => setShowForm(false)} />
        </Card>
      )}

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1 [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f.id ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25" : "text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, key or team…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/15"
          />
        </div>
      </div>

      {!visible ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-56 rounded-3xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center p-12 text-center animate-fade-in">
          <FiFolder className="size-10 text-slate-600" />
          <p className="mt-3 font-medium">
            {query ? "No projects match your search" : filter === "open" ? "No projects yet" : `No ${STATUS[filter].label.toLowerCase()} projects`}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {canCreate && filter === "open" && !query
              ? "Create the first project for this workspace."
              : !canCreate && filter === "open" && !query
                ? "Workspace owners and admins can create projects."
                : "Try another filter."}
          </p>
          {canCreate && filter === "open" && !query && !showForm && (
            <Button className="mt-5" onClick={() => setShowForm(true)}>
              <FiPlus /> New project
            </Button>
          )}
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              to={`/workspaces/${workspaceId}/projects/${project.id}`}
              delay={60 + i * 40}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
};

const ProjectsRoute = () => {
  const { workspaceId } = useParams();
  return <Projects key={workspaceId} workspaceId={workspaceId} />;
};

export default ProjectsRoute;
