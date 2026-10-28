import User from "../models/user.model.js";
import logger from "../utils/logger.js";
import { SAFE_USER_ATTRIBUTES } from "../utils/userAttributes.js";

const ROLES = ["user", "admin"];

const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: SAFE_USER_ATTRIBUTES,
      order: [["createdAt", "ASC"]],
    });
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      count: users.length,
      users,
      // purane /api/admin/users clients "data" padhte the
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (String(req.user.id) === req.params.id) {
      return res.status(403).json({ message: "Admin cannot change own role" });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();
    logger.info(`Role updated: ${user.email} -> ${role} (by ${req.user.email})`);

    res.status(200).json({
      success: true,
      message: "User role updated",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (String(req.user.id) === id) {
      return res.status(403).json({ message: "Admin cannot delete self" });
    }
    const findUser = await User.findByPk(id);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    // RefreshTokens FK ON DELETE CASCADE se user ke sessions bhi hat jaate hain
    await findUser.destroy();
    logger.info(`User deleted: ${findUser.email} (by ${req.user.email})`);
    return res.status(200).json({
      message: "Succesfully delete ",
    });
  } catch (error) {
    next(error);
  }
};

export { getUsers, updateUserRole, deleteUser };
