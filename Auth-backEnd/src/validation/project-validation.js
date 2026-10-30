import Joi from "joi";
import { EDITABLE_PROJECT_STATUSES, PROJECT_PRIORITIES } from "../utils/projectMeta.js";

// sirf "YYYY-MM-DD" aur asli calendar date (2026-02-30 reject)
const dateOnly = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const d = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
      return helpers.error("date.invalidDay");
    }
    return value;
  })
  .allow(null)
  .messages({
    "string.pattern.base": "{#label} must be a date in YYYY-MM-DD format",
    "date.invalidDay": "{#label} is not a valid calendar date",
  });

const uuid = Joi.string().trim().guid();

const fields = {
  name: Joi.string().trim().min(2).max(120),
  key: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z][A-Z0-9]{1,9}$/)
    .messages({
      "string.pattern.base": "Key must be 2-10 letters/numbers and start with a letter (e.g. WEB, APP2)",
    }),
  description: Joi.string().trim().max(2000).allow("", null),
  status: Joi.string()
    .valid(...EDITABLE_PROJECT_STATUSES)
    .messages({ "any.only": "Status must be one of: planning, active, on_hold, completed" }),
  priority: Joi.string()
    .valid(...PROJECT_PRIORITIES)
    .messages({ "any.only": "Priority must be one of: low, medium, high, urgent" }),
  startDate: dateOnly,
  dueDate: dateOnly,
  teamId: uuid.allow(null),
};

// dono dates hon to due >= start (PATCH par existing values ke saath controller dobara check karta hai)
const dateOrder = (value, helpers) => {
  if (value.startDate && value.dueDate && value.dueDate < value.startDate) {
    return helpers.error("dates.order");
  }
  return value;
};
const dateOrderMessage = { "dates.order": "Due date cannot be before the start date" };

export const createProjectSchema = Joi.object({
  ...fields,
  name: fields.name.required(),
})
  .custom(dateOrder)
  .messages(dateOrderMessage);

export const updateProjectSchema = Joi.object({
  ...fields,
  // ownership transfer - sirf workspace owner/admin (controller check karta hai)
  ownerUserId: uuid,
})
  .min(1)
  .custom(dateOrder)
  .messages({ "object.min": "Provide at least one field to update", ...dateOrderMessage });

export const unarchiveProjectSchema = Joi.object({
  status: fields.status,
});

export const deleteProjectSchema = Joi.object({
  confirm: Joi.string().required(),
});

export const addProjectMemberSchema = Joi.object({
  userId: uuid.required(),
});
