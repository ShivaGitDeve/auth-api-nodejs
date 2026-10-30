import {
  fn,
  col,
  Op,
  where as sqlWhere,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} from "sequelize";
import { sequelize, User, WorkspaceMember, Team, TeamMember } from "../models/index.js";
import logger from "../utils/logger.js";
import { normalizeTeamName, teamNameKey } from "../utils/teamName.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const duplicateName = () => httpError(409, "A team with this name already exists in the workspace");

const clean = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value.trim() || null;
};

// same normalization jo DB unique index (workspaceId, lower(name)) use karta hai
const nameTaken = async (workspaceId, name, exceptId) => {
  const found = await Team.findOne({
    where: {
      workspaceId,
      [Op.and]: [sqlWhere(fn("lower", col("name")), teamNameKey(name))],
    },
    attributes: ["id"],
  });
  return Boolean(found && found.id !== exceptId);
};

const serializeTeam = (team, extra = {}) => ({
  id: team.id,
  workspaceId: team.workspaceId,
  name: team.name,
  description: team.description,
  createdById: team.createdById,
  createdAt: team.createdAt,
  updatedAt: team.updatedAt,
  ...extra,
});

const serializeMember = (teamMember, workspaceMember, user) => ({
  id: teamMember.id,
  userId: user.id,
  name: user.name,
  email: user.email,
  workspaceRole: workspaceMember.role,
  addedAt: teamMember.createdAt,
});

const listTeams = async (req, res, next) => {
  try {
    const teams = await Team.findAll({
      where: { workspaceId: req.workspace.id },
      order: [["name", "ASC"]],
    });
    const ids = teams.map((t) => t.id);

    const counts = ids.length
      ? await TeamMember.findAll({
          attributes: ["teamId", [fn("COUNT", col("id")), "count"]],
          where: { teamId: ids },
          group: ["teamId"],
          raw: true,
        })
      : [];
    const countById = Object.fromEntries(counts.map((c) => [c.teamId, Number(c.count)]));

    const mine = await TeamMember.findAll({
      where: { workspaceMemberId: req.membership.id },
      attributes: ["teamId"],
      raw: true,
    });
    const myTeamIds = new Set(mine.map((m) => m.teamId));

    return res.status(200).json({
      success: true,
      count: teams.length,
      teams: teams.map((t) =>
        serializeTeam(t, { memberCount: countById[t.id] || 0, isMember: myTeamIds.has(t.id) }),
      ),
    });
  } catch (error) {
    next(error);
  }
};

const createTeam = async (req, res, next) => {
  try {
    const name = normalizeTeamName(req.body.name);
    if (await nameTaken(req.workspace.id, name)) throw duplicateName();

    const team = await Team.create({
      workspaceId: req.workspace.id,
      name,
      description: clean(req.body.description) ?? null,
      createdById: req.user.id,
    });
    logger.info(`Team created: "${team.name}" in ${req.workspace.slug} by ${req.user.email}`);

    return res.status(201).json({
      success: true,
      message: "Team created",
      team: serializeTeam(team, { memberCount: 0, isMember: false }),
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) return next(duplicateName());
    next(error);
  }
};

const getTeam = async (req, res, next) => {
  try {
    const memberships = await TeamMember.findAll({
      where: { teamId: req.team.id },
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

    const members = memberships.map((m) => serializeMember(m, m.workspaceMember, m.workspaceMember.user));
    return res.status(200).json({
      success: true,
      team: serializeTeam(req.team, {
        memberCount: members.length,
        isMember: members.some((m) => m.userId === req.user.id),
      }),
      members,
    });
  } catch (error) {
    next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const team = req.team;
    const { name, description } = req.body;

    if (name !== undefined) {
      const normalized = normalizeTeamName(name);
      if (teamNameKey(normalized) !== teamNameKey(team.name) && (await nameTaken(team.workspaceId, normalized, team.id))) {
        throw duplicateName();
      }
      team.name = normalized;
    }
    if (description !== undefined) team.description = clean(description);

    await team.save();
    const memberCount = await TeamMember.count({ where: { teamId: team.id } });
    return res.status(200).json({ success: true, message: "Team updated", team: serializeTeam(team, { memberCount }) });
  } catch (error) {
    if (error instanceof UniqueConstraintError) return next(duplicateName());
    next(error);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    // team_members FK ON DELETE CASCADE
    await req.team.destroy();
    logger.info(`Team deleted: "${req.team.name}" in ${req.workspace.slug} by ${req.user.email}`);
    return res.status(200).json({ success: true, message: "Team deleted" });
  } catch (error) {
    next(error);
  }
};

const addTeamMember = async (req, res, next) => {
  try {
    const userId = req.body.userId.trim();

    const result = await sequelize.transaction(async (transaction) => {
      // user ISI workspace ka member hona chahiye (lock: beech mein hataya na jaa sake)
      const workspaceMember = await WorkspaceMember.findOne({
        where: { workspaceId: req.workspace.id, userId },
        transaction,
        lock: transaction.LOCK.SHARE,
      });
      if (!workspaceMember) throw httpError(400, "This user is not a member of the workspace");

      const existing = await TeamMember.findOne({
        where: { teamId: req.team.id, workspaceMemberId: workspaceMember.id },
        transaction,
      });
      if (existing) throw httpError(409, "This user is already in the team");

      const teamMember = await TeamMember.create(
        {
          teamId: req.team.id,
          workspaceMemberId: workspaceMember.id,
          workspaceId: req.workspace.id,
          addedById: req.user.id,
        },
        { transaction },
      );
      const user = await User.findByPk(userId, { attributes: ["id", "name", "email"], transaction });
      return serializeMember(teamMember, workspaceMember, user);
    });

    logger.info(`Team member added: ${result.email} -> "${req.team.name}" (${req.workspace.slug}) by ${req.user.email}`);
    return res.status(201).json({ success: true, message: "Member added to team", member: result });
  } catch (error) {
    if (error instanceof UniqueConstraintError) return next(httpError(409, "This user is already in the team"));
    if (error instanceof ForeignKeyConstraintError) return next(httpError(404, "Team or member no longer exists"));
    next(error);
  }
};

const removeTeamMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const notInTeam = httpError(404, "This user is not in the team");
    if (!UUID_RE.test(userId || "")) throw notInTeam;

    const workspaceMember = await WorkspaceMember.findOne({
      where: { workspaceId: req.workspace.id, userId },
      attributes: ["id"],
    });
    if (!workspaceMember) throw notInTeam;

    const removed = await TeamMember.destroy({
      where: { teamId: req.team.id, workspaceMemberId: workspaceMember.id },
    });
    if (!removed) throw notInTeam;

    logger.info(`Team member removed: user ${userId} from "${req.team.name}" (${req.workspace.slug}) by ${req.user.email}`);
    return res.status(200).json({ success: true, message: "Member removed from team" });
  } catch (error) {
    next(error);
  }
};

export { listTeams, createTeam, getTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember };
