import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

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

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decode.id, {
      attributes: { exclude: ["password"] },
    });
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acess denind" });
    }
    next();
  };  
};

export { proTect, authorizeRole };
