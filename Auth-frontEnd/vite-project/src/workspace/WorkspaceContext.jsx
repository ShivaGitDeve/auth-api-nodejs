import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "../auth/Auth-context";
import { listWorkspaces } from "../api/workspaces";

const WorkspaceContext = createContext(null);

const storageKey = (userId) => `teamflow.currentWorkspace.${userId}`;

const readStored = (userId) => {
  try {
    return localStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
};

const writeStored = (userId, id) => {
  try {
    if (id) localStorage.setItem(storageKey(userId), id);
    else localStorage.removeItem(storageKey(userId));
  } catch {
    // storage blocked - sirf memory mein rahega
  }
};

// Logged-in user ke workspaces + abhi selected (current) workspace.
// Header ka switcher aur workspace pages dono isko use karte hain.
export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [workspaces, setWorkspaces] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectWorkspace = useCallback(
    (id) => {
      setCurrentId(id);
      if (userId) writeStored(userId, id);
    },
    [userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) return [];
    setLoading(true);
    try {
      const list = await listWorkspaces();
      setWorkspaces(list);
      setCurrentId((prev) => {
        const wanted = prev || readStored(userId);
        const next = list.some((w) => w.id === wanted) ? wanted : list[0]?.id || null;
        writeStored(userId, next);
        return next;
      });
      return list;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // login / logout / user change par list reload ya clear
  useEffect(() => {
    if (userId) {
      refresh().catch(() => {});
    } else {
      setWorkspaces([]);
      setCurrentId(null);
    }
  }, [userId, refresh]);

  const upsertWorkspace = useCallback((ws) => {
    setWorkspaces((list) => {
      const exists = list.some((w) => w.id === ws.id);
      const next = exists ? list.map((w) => (w.id === ws.id ? { ...w, ...ws } : w)) : [...list, ws];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  const removeWorkspace = useCallback((id) => {
    setWorkspaces((list) => list.filter((w) => w.id !== id));
    setCurrentId((cur) => (cur === id ? null : cur));
  }, []);

  // current workspace hat gaya (delete) to pehla bacha hua select karo
  useEffect(() => {
    if (userId && !currentId && workspaces.length) {
      selectWorkspace(workspaces[0].id);
    }
  }, [userId, currentId, workspaces, selectWorkspace]);

  const current = workspaces.find((w) => w.id === currentId) || null;

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, current, loading, refresh, selectWorkspace, upsertWorkspace, removeWorkspace }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspaces = () => useContext(WorkspaceContext);
