import {
  fn,
  col,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
} from "sequelize";
import {
  sequelize,
  User,
  WorkspaceMember,
  Team,
  Project,
  ProjectMember,
} from "../models/index.js";
import logger from "../utils/logger.js";
import { projectIncludes } from "../middlewares/project.middleware.js";
import {
  PROJECT_STATUSES,
  normalizeProjectKey,
  suggestProjectKey,
  isValidDateRange,
  canManageProject,
  canAdministerProject,
} from "../utils/projectMeta.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const keyConflict = () => httpError(409, "A project with this key already exists in the workspace");
const archivedError = () => httpError(409, "Archived projects are read-only. Unarchive the project first.");

// DB constraint errors ko saaf 4xx mein badlo (internals leak na hon)
const mapDbError = (error) => {
  if (error instanceof UniqueConstraintError) return keyConflict();
  if (error instanceof ForeignKeyConstraintError) return httpError(400, "Team or member does not belong to this workspace");
  if (error instanceof DatabaseError && error.parent?.code === "23514") return httpError(400, "Invalid project data");
  return error;
};

const clean = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value.trim() || null;
};

const keyTaken = async (workspaceId, key, exceptId) => {
  const found = await Project.findOne({ where: { workspaceId, key }, attributes: ["id"] });
  return Boolean(found && found.id !== exceptId);
};

// naam se key; taken ho to WEB2, WEB3 ...
const generateKey = async (workspaceId, name) => {
  const base = suggestProjectKey(name);
  if (!(await keyTaken(workspaceId, base))) return base;
  for (let i = 2; i < 100; i++) {
    const suffix = String(i);
    const candidate = base.slice(0, 10 - suffix.length) + suffix;
    if (!(await keyTaken(workspaceId, candidate))) return candidate;
  }
  throw keyConflict();
};

// teamId hamesha DB se verify - client ki di hui id par bharosa nahi
const assertTeamInWorkspace = async (teamId, workspaceId) => {
  if (!teamId) return;
  const team = await Team.findOne({ where: { id: teamId, workspaceId }, attributes: ["id"] });
  if (!team) throw httpError(400, "Team not found in this workspace");
};

const findWorkspaceMember = (workspaceId, userId, options = {}) =>
  WorkspaceMember.findOne({ where: { workspaceId, userId }, ...options });

const serializeProject = (project, membership, extra = {}) => ({
  id: project.id,
  workspaceId: project.workspaceId,
  key: project.key,
  name: project.name,
  description: project.description,
  status: project.status,
  priority: project.priority,
  startDate: project.startDate,
  dueDate: project.dueDate,
  archivedAt: project.archivedAt,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
  team: project.team ? { id: project.team.id, name: project.team.name } : null,
  owner: project.ownerMember?.user
    ? {
        userId: project.ownerMember.user.id,
        name: project.ownerMember.user.name,
        email: project.ownerMember.user.email,
      }
    : null,
  permissions: {
    canManage: canManageProject(membership, project),
    canAdminister: canAdministerProject(membership),
  },
  ...extra,
});

const reload = (project) => project.reload({ include: projectIncludes });

const listProjectMembers = async (projectId, ownerMemberId) => {
  const rows = await ProjectMember.findAll({
    where: { projectId },
    include: [
      {
        model: WorkspaceMember,
        as: "workspaceMember",
        required: true,
        include: [{ model: User, as: "user", attributes: ["id", "name", "email"], required: true }],
      },
    ],
    order: [["createdAt", "ASC"]],
  });
  return rows.map((r) => ({
    id: r.id,
    userId: r.workspaceMember.user.id,
    name: r.workspaceMember.user.name,
    email: r.workspaceMember.user.email,
    workspaceRole: r.workspaceMember.role,
    isOwner: r.workspaceMemberId === ownerMemberId,
    addedAt: r.createdAt,
  }));
};

// ---- handlers ----

const listProjects = async (req, res, next) => {
  try {
    const { status, includeArchived } = req.query;
    if (status !== undefined && !PROJECT_STATUSES.includes(status)) {
      throw httpError(400, `Status filter must be one of: ${PROJECT_STATUSES.join(", ")}`);
    }

    const where = { workspaceId: req.workspace.id };
    if (status) where.status = status;
    // default: archived projects list mein nahi
    else if (includeArchived !== "true") where.archivedAt = null;

    const projects = await Project.findAll({
      where,
      include: projectIncludes,
      order: [["createdAt", "DESC"]],
    });
    const ids = projects.map((p) => p.id);

    const counts = ids.length
      ? await ProjectMember.findAll({
          attributes: ["projectId", [fn("COUNT", col("id")), "count"]],
          where: { projectId: ids },
          group: ["projectId"],
          raw: true,
        })
      : [];
    const countById = Object.fromEntries(counts.map((c) => [c.projectId, Number(c.count)]));

    const mine = await ProjectMember.findAll({
      where: { workspaceMemberId: req.membership.id },
      attributes: ["projectId"],
      raw: true,
    });
    const myIds = new Set(mine.map((m) => m.projectId));

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects: projects.map((p) =>
        serializeProject(p, req.membership, { memberCount: countById[p.id] || 0, isMember: myIds.has(p.id) }),
      ),
    });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const name = req.body.name.trim();
    const teamId = req.body.teamId || null;
    await assertTeamInWorkspace(teamId, req.workspace.id);

    let key;
    if (req.body.key) {
      key = normalizeProjectKey(req.body.key);
      if (await keyTaken(req.workspace.id, key)) throw keyConflict();
    } else {
      key = await generateKey(req.workspace.id, name);
    }

    // project + creator ki owner membership ek saath (ek fail -> dono rollback)
    const project = await sequelize.transaction(async (transaction) => {
      const created = await Project.create(
        {
          workspaceId: req.workspace.id,
          name,
          key,
          description: clean(req.body.description) ?? null,
          status: req.body.status || "planning",
          priority: req.body.priority || "medium",
          startDate: req.body.startDate || null,
          dueDate: req.body.dueDate || null,
          teamId,
          ownerMemberId: req.membership.id,
          createdById: req.user.id,
        },
        { transaction },
      );
      await ProjectMember.create(
        {
          projectId: created.id,
          workspaceMemberId: req.membership.id,
          workspaceId: req.workspace.id,
          addedById: req.user.id,
        },
        { transaction },
      );
      return created;
    });

    await reload(project);
    logger.info(`Project created: ${project.key} in ${req.workspace.slug} by ${req.user.email}`);
    return res.status(201).json({
      success: true,
      message: "Project created",
      project: serializeProject(project, req.membership, { memberCount: 1, isMember: true }),
    });
  } catch (error) {
    next(mapDbError(error));
  }
};

const getProject = async (req, res, next) => {
  try {
    const members = await listProjectMembers(req.project.id, req.project.ownerMemberId);
    return res.status(200).json({
      success: true,
      project: serializeProject(req.project, req.membership, {
        memberCount: members.length,
        isMember: members.some((m) => m.userId === req.user.id),
      }),
      members,
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = req.project;
    if (project.archivedAt) throw archivedError();
    const body = req.body;

    if (body.ownerUserId !== undefined && !canAdministerProject(req.membership)) {
      throw httpError(403, "Only workspace owners/admins can change the project owner");
    }
    if (body.teamId !== undefined) await assertTeamInWorkspace(body.teamId, project.workspaceId);

    if (body.key !== undefined) {
      const key = normalizeProjectKey(body.key);
      if (key !== project.key && (await keyTaken(project.workspaceId, key, project.id))) throw keyConflict();
      project.key = key;
    }

    // naye + purane dates milakar check
    const startDate = body.startDate !== undefined ? body.startDate : project.startDate;
    const dueDate = body.dueDate !== undefined ? body.dueDate : project.dueDate;
    if (!isValidDateRange(startDate, dueDate)) throw httpError(400, "Due date cannot be before the start date");

    if (body.name !== undefined) project.name = body.name.trim();
    if (body.description !== undefined) project.description = clean(body.description);
    if (body.status !== undefined) project.status = body.status;
    if (body.priority !== undefined) project.priority = body.priority;
    if (body.teamId !== undefined) project.teamId = body.teamId || null;
    project.startDate = startDate || null;
    project.dueDate = dueDate || null;

    await sequelize.transaction(async (transaction) => {
      if (body.ownerUserId !== undefined) {
        const newOwner = await findWorkspaceMember(project.workspaceId, body.ownerUserId, {
          transaction,
          lock: transaction.LOCK.SHARE,
        });
        if (!newOwner) throw httpError(400, "The new owner must be a member of this workspace");
        project.ownerMemberId = newOwner.id;
        // naya owner project member bhi ho
        await ProjectMember.findOrCreate({
          where: { projectId: project.id, workspaceMemberId: newOwner.id },
          defaults: { workspaceId: project.workspaceId, addedById: req.user.id },
          transaction,
        });
      }
      await project.save({ transaction });
    });

    await reload(project);
    const memberCount = await ProjectMember.count({ where: { projectId: project.id } });
    logger.info(`Project updated: ${project.key} (${req.workspace.slug}) by ${req.user.email}`);
    return res.status(200).json({
      success: true,
      message: "Project updated",
      project: serializeProject(project, req.membership, { memberCount }),
    });
  } catch (error) {
    next(mapDbError(error));
  }
};

const archiveProject = async (req, res, next) => {
  try {
    const project = req.project;
    if (project.archivedAt) throw httpError(409, "Project is already archived");
    project.status = "archived";
    project.archivedAt = new Date();
    await project.save();
    logger.info(`Project archived: ${project.key} (${req.workspace.slug}) by ${req.user.email}`);
    return res.status(200).json({ success: true, message: "Project archived", project: serializeProject(project, req.membership) });
  } catch (error) {
    next(mapDbError(error));
  }
};

const unarchiveProject = async (req, res, next) => {
  try {
    const project = req.project;
    if (!project.archivedAt) throw httpError(409, "Project is not archived");
    project.status = req.body.status || "active";
    project.archivedAt = null;
    await project.save();
    logger.info(`Project unarchived: ${project.key} (${req.workspace.slug}) by ${req.user.email}`);
    return res.status(200).json({ success: true, message: "Project restored", project: serializeProject(project, req.membership) });
  } catch (error) {
    next(mapDbError(error));
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = req.project;
    if (normalizeProjectKey(req.body.confirm) !== project.key) {
      throw httpError(400, "Type the project key to confirm deletion");
    }
    // project_members FK ON DELETE CASCADE
    await project.destroy();
    logger.info(`Project deleted: ${project.key} (${req.workspace.slug}) by ${req.user.email}`);
    return res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    next(error);
  }
};

const getProjectMembers = async (req, res, next) => {
  try {
    const members = await listProjectMembers(req.project.id, req.project.ownerMemberId);
    return res.status(200).json({ success: true, count: members.length, members });
  } catch (error) {
    next(error);
  }
};

const addProjectMember = async (req, res, next) => {
  try {
    const project = req.project;
    if (project.archivedAt) throw archivedError();
    const userId = req.body.userId.trim();

    const member = await sequelize.transaction(async (transaction) => {
      // sirf isi workspace ka member (lock: beech mein hataya na jaa sake)
      const workspaceMember = await findWorkspaceMember(project.workspaceId, userId, {
        transaction,
        lock: transaction.LOCK.SHARE,
      });
      if (!workspaceMember) throw httpError(400, "This user is not a member of the workspace");

      const existing = await ProjectMember.findOne({
        where: { projectId: project.id, workspaceMemberId: workspaceMember.id },
        transaction,
      });
      if (existing) throw httpError(409, "This user is already a project member");

      const row = await ProjectMember.create(
        {
          projectId: project.id,
          workspaceMemberId: workspaceMember.id,
          workspaceId: project.workspaceId,
          addedById: req.user.id,
        },
        { transaction },
      );
      const user = await User.findByPk(userId, { attributes: ["id", "name", "email"], transaction });
      return {
        id: row.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        workspaceRole: workspaceMember.role,
        isOwner: workspaceMember.id === project.ownerMemberId,
        addedAt: row.createdAt,
      };
    });

    logger.info(`Project member added: ${member.email} -> ${project.key} (${req.workspace.slug}) by ${req.user.email}`);
    return res.status(201).json({ success: true, message: "Member added to project", member });
  } catch (error) {
    if (error instanceof UniqueConstraintError) return next(httpError(409, "This user is already a project member"));
    if (error instanceof ForeignKeyConstraintError) return next(httpError(404, "Project or member no longer exists"));
    next(error);
  }
};

const removeProjectMember = async (req, res, next) => {
  try {
    const project = req.project;
    if (project.archivedAt) throw archivedError();
    const { userId } = req.params;
    const notMember = httpError(404, "This user is not a project member");
    if (!UUID_RE.test(userId || "")) throw notMember;

    const workspaceMember = await findWorkspaceMember(project.workspaceId, userId, { attributes: ["id"] });
    if (!workspaceMember) throw notMember;
    if (workspaceMember.id === project.ownerMemberId) {
      throw httpError(409, "Transfer project ownership before removing the project owner");
    }

    const removed = await ProjectMember.destroy({
      where: { projectId: project.id, workspaceMemberId: workspaceMember.id },
    });
    if (!removed) throw notMember;

    logger.info(`Project member removed: user ${userId} from ${project.key} (${req.workspace.slug}) by ${req.user.email}`);
    return res.status(200).json({ success: true, message: "Member removed from project" });
  } catch (error) {
    next(error);
  }
};

export {
  listProjects,
  createProject,
  getProject,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
};
