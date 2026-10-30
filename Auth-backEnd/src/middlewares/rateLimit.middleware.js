import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many login attempts. Please try again later!",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// invitation emails ka spam rokne ke liye (per IP)
export const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    message: "Too many invitations sent. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
});

export const forgotLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max:5,
    message:{
        message: "Too many password reset request. Try again later"
    },
    standardHeaders: true,
    legacyHeaders: false
})
