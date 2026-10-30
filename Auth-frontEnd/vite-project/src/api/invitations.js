import api from "./axios";

export const listInvitations = (workspaceId) =>
  api.get(`/workspaces/${workspaceId}/invitations`).then((r) => r.data.invitations);

export const createInvitation = (workspaceId, data) =>
  api.post(`/workspaces/${workspaceId}/invitations`, data).then((r) => r.data);

export const revokeInvitation = (workspaceId, invitationId) =>
  api.post(`/workspaces/${workspaceId}/invitations/${invitationId}/revoke`).then((r) => r.data.invitation);

export const resendInvitation = (workspaceId, invitationId) =>
  api.post(`/workspaces/${workspaceId}/invitations/${invitationId}/resend`).then((r) => r.data);

// token body mein bhejte hain, URL mein nahi
export const previewInvitation = (token) => api.post("/invitations/preview", { token }).then((r) => r.data);

export const acceptInvitation = (token) => api.post("/invitations/accept", { token }).then((r) => r.data);
