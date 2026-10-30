import Joi from "joi";

const name = Joi.string().trim().min(2).max(80);
const description = Joi.string().trim().max(500).allow("", null);
const slug = Joi.string()
  .trim()
  .min(3)
  .max(60)
  .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .messages({
    "string.pattern.base": "Slug can only contain lowercase letters, numbers and single dashes",
  });

export const createWorkspaceSchema = Joi.object({
  name: name.required(),
  description,
  slug,
});

export const updateWorkspaceSchema = Joi.object({
  name,
  description,
  slug,
})
  .min(1)
  .messages({ "object.min": "Provide at least one field to update" });

// delete confirm karne ke liye workspace ka exact naam
export const deleteWorkspaceSchema = Joi.object({
  confirm: Joi.string().required(),
});
