import api from "./axios";

export const listWorkspaces = () => api.get("/workspaces").then((r) => r.data.workspaces);

export const createWorkspace = (data) => api.post("/workspaces", data).then((r) => r.data.workspace);

export const getWorkspace = (id) => api.get(`/workspaces/${id}`).then((r) => r.data);

export const updateWorkspace = (id, data) =>
  api.patch(`/workspaces/${id}`, data).then((r) => r.data.workspace);

export const deleteWorkspace = (id, confirm) =>
  api.delete(`/workspaces/${id}`, { data: { confirm } }).then((r) => r.data);

// backend ka Joi error ya message - jo bhi pehle mile
export const apiError = (error, fallback) => {
  const data = error.response?.data;
  return data?.error?.[0] || data?.message || fallback;
};
