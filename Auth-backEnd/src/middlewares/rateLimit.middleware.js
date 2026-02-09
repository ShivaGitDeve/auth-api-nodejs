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

export const forgotLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max:5,
    message:{
        message: "Too many password reset request. Try again later"
    },
    standardHeaders: true,
    legacyHeaders: false
})
