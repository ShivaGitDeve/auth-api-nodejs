// User fields that must never be sent to a client
export const SENSITIVE_USER_FIELDS = [
  "password",
  "resetPasswordToken",
  "resetPasswordExpires",
];

export const SAFE_USER_ATTRIBUTES = { exclude: SENSITIVE_USER_FIELDS };
