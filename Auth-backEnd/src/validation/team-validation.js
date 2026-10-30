import Joi from "joi";

const name = Joi.string().trim().min(2).max(80);
const description = Joi.string().trim().max(500).allow("", null);

export const createTeamSchema = Joi.object({
  name: name.required(),
  description,
});

export const updateTeamSchema = Joi.object({
  name,
  description,
})
  .min(1)
  .messages({ "object.min": "Provide at least one field to update" });

export const addTeamMemberSchema = Joi.object({
  userId: Joi.string().trim().guid().required().messages({
    "string.guid": "userId must be a valid id",
  }),
});
