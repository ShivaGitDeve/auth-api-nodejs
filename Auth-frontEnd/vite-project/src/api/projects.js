import api from "./axios";

const base = (workspaceId) => `/workspaces/${workspaceId}/projects`;

export const listProjects = (workspaceId, params = {}) =>
  api.get(base(workspaceId), { params }).then((r) => r.data.projects);

export const createProject = (workspaceId, data) => api.post(base(workspaceId), data).then((r) => r.data.project);

export const getProject = (workspaceId, projectId) =>
  api.get(`${base(workspaceId)}/${projectId}`).then((r) => r.data);

export const updateProject = (workspaceId, projectId, data) =>
  api.patch(`${base(workspaceId)}/${projectId}`, data).then((r) => r.data.project);

export const archiveProject = (workspaceId, projectId) =>
  api.post(`${base(workspaceId)}/${projectId}/archive`).then((r) => r.data.project);

export const unarchiveProject = (workspaceId, projectId, status) =>
  api.post(`${base(workspaceId)}/${projectId}/unarchive`, status ? { status } : {}).then((r) => r.data.project);

export const deleteProject = (workspaceId, projectId, confirm) =>
  api.delete(`${base(workspaceId)}/${projectId}`, { data: { confirm } }).then((r) => r.data);

export const addProjectMember = (workspaceId, projectId, userId) =>
  api.post(`${base(workspaceId)}/${projectId}/members`, { userId }).then((r) => r.data.member);

export const removeProjectMember = (workspaceId, projectId, userId) =>
  api.delete(`${base(workspaceId)}/${projectId}/members/${userId}`).then((r) => r.data);
