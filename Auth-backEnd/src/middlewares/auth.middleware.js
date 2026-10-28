import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { SAFE_USER_ATTRIBUTES } from "../utils/userAttributes.js";

const proTect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Token agar missing hua
  if (!token) {
    return res.status(401).json({ message: "Token Missing" });
  }

  // token verify karlo
  let decode;
  try {
    decode = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }

  try {
    const user = await User.findByPk(decode.id, {
      attributes: SAFE_USER_ATTRIBUTES,
    });

    // token valid hai par user delete ho chuka hai
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is disabled" });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acess denind" });
    }
    next();
  };
};

export { proTect, authorizeRole };
