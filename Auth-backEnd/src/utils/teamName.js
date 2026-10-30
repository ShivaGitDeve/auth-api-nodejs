// Team naam ki ek hi normalization strategy - app aur DB index dono isi par tike hain:
// save: trim + beech ke multiple spaces ek space; uniqueness: lower(name) (DB index).
export const normalizeTeamName = (name) => String(name).trim().replace(/\s+/g, " ");

export const teamNameKey = (name) => normalizeTeamName(name).toLowerCase();
