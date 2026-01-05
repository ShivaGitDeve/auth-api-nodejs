import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Token from "../utils/generateAccessToken.js";
import RefreshToken from "../utils/genrateRefreshTokens.js";

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const extingUser = await User.findOne({ where: { email } });
    if (extingUser) {
      return res.status(409).json({ message: "User already exit" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const createUser = await User.create({
      name,
      email,
      password: hashPassword,
    });
    return res.status(201).json({
      message: "User created succesfully",
      data: {
        id: createUser.id,
        name: createUser.name,
        email: createUser.email,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ message: "All field required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const psdMatch = await bcrypt.compare(password, user.password);
    if (!psdMatch) {
      return res.status(401).json({ message: "Password not matching" });
    }

    const accessToken = Token(user);
    const refreshToken = RefreshToken(user);

    await refreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    return res.status(200).json({
      message: "Login succesful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === id) {
      return res.status(403).json({ message: "Admin cannot delete self" });
    }
    const findUser = await User.findByPk(id);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    await findUser.destroy();
    return res.status(200).json({
      message: "Succesfully delete ",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export { registerUser, loginUser, deleteUser };
