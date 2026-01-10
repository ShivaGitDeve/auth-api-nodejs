import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/user.model.js";
import Token from "../utils/generateAccessToken.js";
import RefreshToken from "../utils/genrateRefreshTokens.js";
import RefreshTokenModel from "../models/refreshToken.model.js";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";



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



const refeshAT = async (req, res) => {
  try {
    const R_A_T =
      req.headers.authorization?.startsWith("Bearer") &&
      req.headers.authorization.split(" ")[1];
    if (!R_A_T) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    // verify refresh token
    const decoded = jwt.verify(R_A_T, process.env.REFRESH_JWT_SECRET);

    // check DB
    const storedToken = await RefreshTokenModel.findOne({ where: { R_A_T } });

    if (!storedToken) {
      return res.status(401).json({ message: "Invalid Refresh Token" });
    }

    if (storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: "Refresh Token Expired" });
    }

    const newAccessToken = Token({
      id: decoded.id,
      role: decoded.role,
    });
    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid refresh token(Server)", error });
  }
};



const forgotPswd = async (req, res) => {
  try {
    const { email } = req.body;
    // if (!email) {
    //   return res.status(401).json({ message: "Email not found" });
    // }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(200)
        .json({ message: "If the email exists, a reset link has been sent" });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPaswrdToken = hashedToken;
    user.resetPaswrdExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    return res
      .status(200)
      .json({ message: "Password reset link sent", resetLink });
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid refresh token(Server)", error });
  }
};



const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and New Password both are missing" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    // find user with valid token
    const user = await User.findOne({
      where: {
        resetPaswrdToken: hashedToken,
        resetPaswrdExpires: { [Op.get]: Date.now() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    user.resetPaswrdToken = null;
    user.resetPaswrdExpires = null;
    await user.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid refresh token(Server)", error });
  }
};

export { registerUser, loginUser, deleteUser, refeshAT, forgotPswd, resetPassword };
