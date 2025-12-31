import User from "../models/user.model.js";

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    return res.status(200).json({
      message: "Users fetched successfully",
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ message: "server Error", error });
  }
};

export { getUsers };
