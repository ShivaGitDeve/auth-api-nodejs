import { fn, col, where as sqlWhere, UniqueConstraintError } from "sequelize";
import {
  sequelize,
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
} from "../models/index.js";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";
import config from "../config/env.js";
import { canManageInviteRole } from "../utils/workspaceRoles.js";
import { createInvitationToken, hashInvitationToken } from "../utils/invitationToken.js";
import { serializeWorkspace } from "./workspace.controller.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const normalizeEmail = (email) => String(email).trim().toLowerCase();

const findUserByEmail = (email, transaction) =>
  User.findOne({
    where: sqlWhere(fn("lower", col("email")), normalizeEmail(email)),
    attributes: ["id", "email", "name"],
    transaction,
  });

// "pending" lekin expiry nikal chuki ho to client ko "expired" dikhao
const effectiveStatus = (inv) =>
  inv.status === "pending" && new Date(inv.expiresAt) < new Date() ? "expired" : inv.status;

const serialize = (inv) => ({
  id: inv.id,
  email: inv.email,
  role: inv.role,
  status: effectiveStatus(inv),
  expiresAt: inv.expiresAt,
  createdAt: inv.createdAt,
  updatedAt: inv.updatedAt,
  acceptedAt: inv.acceptedAt,
  revokedAt: inv.revokedAt,
  invitedBy: inv.invitedBy ? { id: inv.invitedBy.id, name: inv.invitedBy.name } : null,
});

const escapeHtml = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// email bhejo; fail ho to invitation phir bhi rehti hai (Resend se dobara bhej sakte hain)
const deliverInvitation = async ({ email, role, token, workspace, inviter, expiresAt }) => {
  const link = `${config.frontendUrl}/invitations/accept?token=${encodeURIComponent(token)}`;
  const expires = new Date(expiresAt).toUTCString();
  const text =
    `${inviter.name} invited you to join the "${workspace.name}" workspace on TeamFlow as ${role}.\n\n` +
    `Accept the invitation: ${link}\n\n` +
    `This link expires on ${expires} and can only be used once. ` +
    `If you weren't expecting this, you can ignore this email.`;
  const html =
    `<p><strong>${escapeHtml(inviter.name)}</strong> invited you to join the ` +
    `<strong>${escapeHtml(workspace.name)}</strong> workspace on TeamFlow as <strong>${escapeHtml(role)}</strong>.</p>` +
    `<p><a href="${escapeHtml(link)}">Accept the invitation</a></p>` +
    `<p style="color:#666;font-size:13px">This link expires on ${escapeHtml(expires)} and can only be used once. ` +
    `If you weren't expecting this, you can ignore this email.</p>`;
  try {
    await sendEmail(email, `You're invited to ${workspace.name} on TeamFlow`, text, html);
    return true;
  } catch (error) {
    logger.error(`Invitation email to ${email} failed: ${error.message}`);
    return false;
  }
};

const isMember = async (workspaceId, email) => {
  const user = await findUserByEmail(email);
  if (!user) return false;
  const count = await WorkspaceMember.count({ where: { workspaceId, userId: user.id } });
  return count > 0;
};

// ---- workspace-scoped (owner/admin) ----

const createInvitation = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const role = req.body.role || "member";

    if (!canManageInviteRole(req.membership.role, role)) {
      throw httpError(403, "Only workspace owners can invite admins");
    }
    if (await isMember(req.workspace.id, email)) {
      throw httpError(409, "This person is already a member of the workspace");
    }

    const existing = await WorkspaceInvitation.findOne({
      where: { workspaceId: req.workspace.id, email, status: "pending" },
    });
    if (existing) {
      if (effectiveStatus(existing) === "pending") {
        throw httpError(409, "A pending invitation already exists for this email. Use resend instead.");
      }
      // purani pending invitation expire ho chuki - band karke nayi banao
      existing.status = "expired";
      await existing.save();
    }

    const { token, tokenHash, expiresAt } = createInvitationToken();
    const invitation = await WorkspaceInvitation.create({
      workspaceId: req.workspace.id,
      email,
      role,
      invitedById: req.user.id,
      tokenHash,
      expiresAt,
    });

    const emailSent = await deliverInvitation({
      email,
      role,
      token,
      workspace: req.workspace,
      inviter: req.user,
      expiresAt,
    });
    logger.info(`Invitation created: ${email} -> ${req.workspace.slug} as ${role} by ${req.user.email}`);

    invitation.invitedBy = req.user;
    return res.status(201).json({
      success: true,
      message: emailSent ? "Invitation sent" : "Invitation saved, but the email could not be sent. Try resending.",
      emailSent,
      invitation: serialize(invitation),
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return next(httpError(409, "A pending invitation already exists for this email. Use resend instead."));
    }
    next(error);
  }
};

const listInvitations = async (req, res, next) => {
  try {
    const invitations = await WorkspaceInvitation.findAll({
      where: { workspaceId: req.workspace.id },
      include: [{ model: User, as: "invitedBy", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({
      success: true,
      count: invitations.length,
      invitations: invitations.map(serialize),
    });
  } catch (error) {
    next(error);
  }
};

// invitation sirf isi workspace ki ho - doosre workspace ki id par 404
const loadInvitation = async (req) => {
  const { invitationId } = req.params;
  if (!UUID_RE.test(invitationId || "")) throw httpError(404, "Invitation not found");
  const invitation = await WorkspaceInvitation.findOne({
    where: { id: invitationId, workspaceId: req.workspace.id },
    include: [{ model: User, as: "invitedBy", attributes: ["id", "name"] }],
  });
  if (!invitation) throw httpError(404, "Invitation not found");
  if (!canManageInviteRole(req.membership.role, invitation.role)) {
    throw httpError(403, "Only workspace owners can manage admin invitations");
  }
  return invitation;
};

const revokeInvitation = async (req, res, next) => {
  try {
    const invitation = await loadInvitation(req);
    if (invitation.status === "accepted") throw httpError(409, "This invitation was already accepted");
    if (invitation.status === "revoked") throw httpError(409, "This invitation was already revoked");

    invitation.status = "revoked";
    invitation.revokedAt = new Date();
    await invitation.save();
    logger.info(`Invitation revoked: ${invitation.email} (${req.workspace.slug}) by ${req.user.email}`);

    return res.status(200).json({ success: true, message: "Invitation revoked", invitation: serialize(invitation) });
  } catch (error) {
    next(error);
  }
};

const resendInvitation = async (req, res, next) => {
  try {
    const invitation = await loadInvitation(req);
    if (invitation.status === "accepted") throw httpError(409, "This invitation was already accepted");
    if (invitation.status === "revoked") throw httpError(409, "Revoked invitations cannot be resent");
    if (await isMember(req.workspace.id, invitation.email)) {
      throw httpError(409, "This person is already a member of the workspace");
    }

    // naya token: purana link turant band
    const { token, tokenHash, expiresAt } = createInvitationToken();
    invitation.tokenHash = tokenHash;
    invitation.expiresAt = expiresAt;
    invitation.status = "pending";
    await invitation.save();

    const emailSent = await deliverInvitation({
      email: invitation.email,
      role: invitation.role,
      token,
      workspace: req.workspace,
      inviter: req.user,
      expiresAt,
    });
    logger.info(`Invitation resent: ${invitation.email} (${req.workspace.slug}) by ${req.user.email}`);

    return res.status(200).json({
      success: true,
      message: emailSent ? "Invitation resent" : "Invitation renewed, but the email could not be sent.",
      emailSent,
      invitation: serialize(invitation),
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return next(httpError(409, "Another pending invitation already exists for this email"));
    }
    next(error);
  }
};

// ---- token-based (invitee) ----

// public: acceptance page ko dikhane ke liye minimal info
const previewInvitation = async (req, res, next) => {
  try {
    const invitation = await WorkspaceInvitation.findOne({
      where: { tokenHash: hashInvitationToken(req.body.token.trim()) },
      include: [
        { model: Workspace, as: "workspace", attributes: ["name"] },
        { model: User, as: "invitedBy", attributes: ["name"] },
      ],
    });
    if (!invitation || !invitation.workspace) throw httpError(404, "This invitation link is invalid");

    const status = effectiveStatus(invitation);
    const accountExists = status === "pending" ? Boolean(await findUserByEmail(invitation.email)) : undefined;

    return res.status(200).json({
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        status,
        expiresAt: invitation.expiresAt,
        workspaceName: invitation.workspace.name,
        invitedByName: invitation.invitedBy?.name || null,
      },
      accountExists,
    });
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (req, res, next) => {
  try {
    const tokenHash = hashInvitationToken(req.body.token.trim());

    // row lock: ek hi invitation do baar accept na ho sake
    const result = await sequelize.transaction(async (transaction) => {
      const invitation = await WorkspaceInvitation.findOne({
        where: { tokenHash },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!invitation) return { error: httpError(404, "This invitation link is invalid") };
      if (invitation.status === "accepted") return { error: httpError(410, "This invitation has already been used") };
      if (invitation.status === "revoked") return { error: httpError(410, "This invitation was revoked") };
      if (effectiveStatus(invitation) === "expired") {
        if (invitation.status !== "expired") {
          invitation.status = "expired";
          await invitation.save({ transaction });
        }
        return { error: httpError(410, "This invitation has expired. Ask for a new one.") };
      }

      if (normalizeEmail(req.user.email) !== invitation.email) {
        return {
          error: httpError(403, `This invitation was sent to ${invitation.email}. Sign in with that email to accept it.`),
        };
      }

      const existing = await WorkspaceMember.findOne({
        where: { workspaceId: invitation.workspaceId, userId: req.user.id },
        transaction,
      });
      if (!existing) {
        await WorkspaceMember.create(
          { workspaceId: invitation.workspaceId, userId: req.user.id, role: invitation.role },
          { transaction },
        );
      }

      invitation.status = "accepted";
      invitation.acceptedAt = new Date();
      invitation.acceptedById = req.user.id;
      await invitation.save({ transaction });

      return {
        workspaceId: invitation.workspaceId,
        role: existing ? existing.role : invitation.role,
        alreadyMember: Boolean(existing),
      };
    });

    if (result.error) throw result.error;

    const workspace = await Workspace.findByPk(result.workspaceId);
    const memberCount = await WorkspaceMember.count({ where: { workspaceId: result.workspaceId } });
    logger.info(`Invitation accepted: ${req.user.email} joined ${workspace.slug} as ${result.role}`);

    return res.status(200).json({
      success: true,
      message: result.alreadyMember ? "You are already a member of this workspace" : "Invitation accepted",
      alreadyMember: result.alreadyMember,
      workspace: serializeWorkspace(workspace, result.role, memberCount),
    });
  } catch (error) {
    next(error);
  }
};

export {
  createInvitation,
  listInvitations,
  revokeInvitation,
  resendInvitation,
  previewInvitation,
  acceptInvitation,
};
