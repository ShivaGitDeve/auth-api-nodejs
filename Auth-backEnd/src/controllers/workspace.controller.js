import crypto from "crypto";
import { fn, col, UniqueConstraintError } from "sequelize";
import { sequelize, User, Workspace, WorkspaceMember } from "../models/index.js";
import logger from "../utils/logger.js";

const slugConflict = () =>
  Object.assign(new Error("Workspace slug is already taken"), { statusCode: 409 });

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "") || "workspace";

const slugTaken = async (slug, transaction, exceptId) => {
  const found = await Workspace.findOne({ where: { slug }, attributes: ["id"], transaction });
  return Boolean(found && found.id !== exceptId);
};

// naam se unique slug: "acme-inc", phir zaroorat ho to "acme-inc-3f9a"
const generateSlug = async (name, transaction) => {
  const base = slugify(name).padEnd(3, "0");
  if (!(await slugTaken(base, transaction))) return base;
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${crypto.randomBytes(2).toString("hex")}`;
    if (!(await slugTaken(candidate, transaction))) return candidate;
  }
  throw slugConflict();
};

const clean = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value.trim() || null;
};

const serialize = (workspace, role, memberCount) => ({
  id: workspace.id,
  name: workspace.name,
  slug: workspace.slug,
  description: workspace.description,
  createdById: workspace.createdById,
  createdAt: workspace.createdAt,
  updatedAt: workspace.updatedAt,
  role,
  memberCount,
});

const createWorkspace = async (req, res, next) => {
  try {
    const name = req.body.name.trim();
    const description = clean(req.body.description) ?? null;
    const requestedSlug = clean(req.body.slug);

    // workspace + owner membership ek saath - ek fail hua to dono rollback
    const workspace = await sequelize.transaction(async (transaction) => {
      let slug = requestedSlug;
      if (slug) {
        if (await slugTaken(slug, transaction)) throw slugConflict();
      } else {
        slug = await generateSlug(name, transaction);
      }

      const created = await Workspace.create(
        { name, slug, description, createdById: req.user.id },
        { transaction },
      );
      await WorkspaceMember.create(
        { workspaceId: created.id, userId: req.user.id, role: "owner" },
        { transaction },
      );
      return created;
    });

    logger.info(`Workspace created: ${workspace.slug} by ${req.user.email}`);
    return res.status(201).json({
      success: true,
      message: "Workspace created",
      workspace: serialize(workspace, "owner", 1),
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) return next(slugConflict());
    next(error);
  }
};

const listMyWorkspaces = async (req, res, next) => {
  try {
    const memberships = await WorkspaceMember.findAll({
      where: { userId: req.user.id },
      include: [{ model: Workspace, as: "workspace", required: true }],
      order: [[{ model: Workspace, as: "workspace" }, "name", "ASC"]],
    });

    const ids = memberships.map((m) => m.workspaceId);
    const counts = ids.length
      ? await WorkspaceMember.findAll({
          attributes: ["workspaceId", [fn("COUNT", col("id")), "count"]],
          where: { workspaceId: ids },
          group: ["workspaceId"],
          raw: true,
        })
      : [];
    const countById = Object.fromEntries(counts.map((c) => [c.workspaceId, Number(c.count)]));

    const workspaces = memberships.map((m) =>
      serialize(m.workspace, m.role, countById[m.workspaceId] || 1),
    );
    return res.status(200).json({ success: true, count: workspaces.length, workspaces });
  } catch (error) {
    next(error);
  }
};

const getWorkspace = async (req, res, next) => {
  try {
    const members = await WorkspaceMember.findAll({
      where: { workspaceId: req.workspace.id },
      include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      workspace: serialize(req.workspace, req.membership.role, members.length),
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user?.name,
        email: m.user?.email,
        role: m.role,
        joinedAt: m.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const updateWorkspace = async (req, res, next) => {
  try {
    const workspace = req.workspace;
    const { name, description, slug } = req.body;

    if (name !== undefined) workspace.name = name.trim();
    if (description !== undefined) workspace.description = clean(description);
    if (slug !== undefined && slug.trim() !== workspace.slug) {
      const newSlug = slug.trim();
      if (await slugTaken(newSlug, undefined, workspace.id)) throw slugConflict();
      workspace.slug = newSlug;
    }

    await workspace.save();
    const memberCount = await WorkspaceMember.count({ where: { workspaceId: workspace.id } });

    return res.status(200).json({
      success: true,
      message: "Workspace updated",
      workspace: serialize(workspace, req.membership.role, memberCount),
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) return next(slugConflict());
    next(error);
  }
};

const deleteWorkspace = async (req, res, next) => {
  try {
    const workspace = req.workspace;
    if (req.body.confirm !== workspace.name) {
      return res
        .status(400)
        .json({ message: "Type the exact workspace name to confirm deletion" });
    }

    // workspace_members FK ON DELETE CASCADE se members bhi hat jaate hain
    await workspace.destroy();
    logger.info(`Workspace deleted: ${workspace.slug} by ${req.user.email}`);
    return res.status(200).json({ success: true, message: "Workspace deleted" });
  } catch (error) {
    next(error);
  }
};

export {
  createWorkspace,
  listMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  slugify,
  serialize as serializeWorkspace,
};
