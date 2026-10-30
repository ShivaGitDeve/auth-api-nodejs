import api from "./axios";

const base = (workspaceId) => `/workspaces/${workspaceId}/teams`;

export const listTeams = (workspaceId) => api.get(base(workspaceId)).then((r) => r.data.teams);

export const createTeam = (workspaceId, data) => api.post(base(workspaceId), data).then((r) => r.data.team);

export const getTeam = (workspaceId, teamId) => api.get(`${base(workspaceId)}/${teamId}`).then((r) => r.data);

export const updateTeam = (workspaceId, teamId, data) =>
  api.patch(`${base(workspaceId)}/${teamId}`, data).then((r) => r.data.team);

export const deleteTeam = (workspaceId, teamId) => api.delete(`${base(workspaceId)}/${teamId}`).then((r) => r.data);

export const addTeamMember = (workspaceId, teamId, userId) =>
  api.post(`${base(workspaceId)}/${teamId}/members`, { userId }).then((r) => r.data.member);

export const removeTeamMember = (workspaceId, teamId, userId) =>
  api.delete(`${base(workspaceId)}/${teamId}/members/${userId}`).then((r) => r.data);
