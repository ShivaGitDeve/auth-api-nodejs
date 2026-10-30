// backend (workspace-validation.js) jaisa hi slug rule
export const SLUG_PATTERN = "[a-z0-9]+(-[a-z0-9]+)*";

export const toSlug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
