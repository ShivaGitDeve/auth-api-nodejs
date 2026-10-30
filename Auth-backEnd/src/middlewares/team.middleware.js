import { Team } from "../models/index.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// loadWorkspaceMembership ke baad chalta hai. Team sirf ISI workspace mein dhoondhi jaati hai,
// isliye doosre workspace ki team id par hamesha 404.
export const loadTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    if (!UUID_RE.test(teamId || "")) {
      return res.status(404).json({ message: "Team not found" });
    }
    const team = await Team.findOne({ where: { id: teamId, workspaceId: req.workspace.id } });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    req.team = team;
    next();
  } catch (error) {
    next(error);
  }
};
