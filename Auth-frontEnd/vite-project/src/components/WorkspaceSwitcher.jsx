import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiCheck, FiChevronDown, FiLayers, FiPlus } from "react-icons/fi";
import { useWorkspaces } from "../workspace/WorkspaceContext";
import { WorkspaceAvatar } from "./workspace";

const WorkspaceSwitcher = () => {
  const { workspaces, current, loading, selectWorkspace } = useWorkspaces();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (ws) => {
    selectWorkspace(ws.id);
    setOpen(false);
    navigate(`/workspaces/${ws.id}`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex max-w-[220px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-2.5 text-left transition hover:border-white/20 hover:bg-white/[0.07]"
      >
        {current ? (
          <WorkspaceAvatar name={current.name} className="size-7 text-[11px]" />
        ) : (
          <span className="grid size-7 place-items-center rounded-lg bg-white/5 text-slate-400">
            <FiLayers className="size-3.5" />
          </span>
        )}
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium leading-tight text-white">
            {current?.name || (loading ? "Loading..." : "No workspace")}
          </span>
          {current && <span className="block text-[11px] capitalize leading-tight text-slate-500">{current.role}</span>}
        </span>
        <FiChevronDown className={`size-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d1c]/95 shadow-2xl shadow-black/60 backdrop-blur-xl animate-scale-in">
          <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Your workspaces
          </p>
          <ul role="listbox" className="max-h-72 overflow-y-auto p-1.5">
            {workspaces.length === 0 && (
              <li className="px-3 py-3 text-sm text-slate-500">You’re not in any workspace yet.</li>
            )}
            {workspaces.map((ws) => (
              <li key={ws.id}>
                <button
                  role="option"
                  aria-selected={ws.id === current?.id}
                  onClick={() => choose(ws)}
                  className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.06]"
                >
                  <WorkspaceAvatar name={ws.name} className="size-8 text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{ws.name}</span>
                    <span className="block text-xs capitalize text-slate-500">
                      {ws.role} · {ws.memberCount} member{ws.memberCount === 1 ? "" : "s"}
                    </span>
                  </span>
                  {ws.id === current?.id && <FiCheck className="size-4 text-violet-300" />}
                </button>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-1.5 border-t border-white/5 p-1.5">
            <Link
              to="/workspaces"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <FiLayers className="size-3.5" /> All workspaces
            </Link>
            <Link
              to="/workspaces?new=1"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-600/20 px-3 py-2 text-xs font-medium text-violet-200 transition hover:bg-violet-600/30"
            >
              <FiPlus className="size-3.5" /> New workspace
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
