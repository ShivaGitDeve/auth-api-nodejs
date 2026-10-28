import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/user.model.js";
import Token from "../utils/generateAccessToken.js";
import RefreshToken from "../utils/genrateRefreshTokens.js";
import RefreshTokenModel from "../models/refreshToken.model.js";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";
import config from "../config/env.js";
import { SAFE_USER_ATTRIBUTES } from "../utils/userAttributes.js";
// import { userInfo } from "os";

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: SAFE_USER_ATTRIBUTES,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    logger.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // if (!name || !email || !password) {
    //   return res.status(400).json({ message: "All fields are required" });
    // }
    const extingUser = await User.findOne({ where: { email } });
    if (extingUser) {
      return res.status(409).json({ message: "User already exit" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const createUser = await User.create({
      name,
      email,
      password: hashPassword,
      // public signup se kabhi admin nahi ban sakte
      role: "user",
    });

    // welcome mail - signup fail nahi hona chahiye agar mail na jaye
    sendEmail(
      createUser.email,
      "Welcome to Auth App",
      `Hi ${createUser.name},\n\nYour account has been created successfully. You can now login at ${config.frontendUrl}/login`,
    ).catch((err) => logger.error(`Welcome mail failed: ${err.message}`));

    return res.status(201).json({
      message: "User created succesfully",
      data: {
        id: createUser.id,
        name: createUser.name,
        email: createUser.email,
      },
    });
  } catch (error) {
    logger.error(error.message);
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
      logger.error(`Login failed - user not found: ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const psdMatch = await bcrypt.compare(password, user.password);
    if (!psdMatch) {
      logger.error(`Login failed - wrong password: ${email}`);
      return res.status(401).json({ message: "Incorrect Password" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is disabled" });
    }

    const accessToken = Token(user);
    const refreshTokenValue = RefreshToken(user);

    await RefreshTokenModel.create({
      token: refreshTokenValue,
      userId: user.id,
      expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    return res.status(200).json({
      message: "Login succesful",
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(error.message);
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
    const storedToken = await RefreshTokenModel.findOne({
      where: { token: R_A_T },
    });

    if (!storedToken) {
      await RefreshTokenModel.destroy({
        where: { userId: decoded.id },
      });
      return res
        .status(401)
        .json({ message: "Refresh token reuse detected. Please login again." });
    }

    // DB column ka naam "expire" hai
    if (storedToken.expire < new Date()) {
      await storedToken.destroy();
      return res.status(401).json({ message: "Refresh Token Expired" });
    }

    await RefreshTokenModel.destroy({
      where: { token: R_A_T },
    });

    const newAccessToken = Token({
      id: decoded.id,
      role: decoded.role,
    });

    const newRefreshToken = RefreshToken({
      id: decoded.id,
      role: decoded.role,
    });

    await RefreshTokenModel.create({
      token: newRefreshToken,
      userId: decoded.id,
      expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return res
      .status(200)
      .json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
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
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    await sendEmail(
      user.email,
      "Password Reset Request",
      `Click the link to reset your password: ${resetLink}`,
    );
    return res.status(200).json({ message: "Password reset link sent" });
  } catch (error) {
    logger.error(`Forgot password failed: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Failed to send reset email. Try again later." });
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
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // password reset ke baad saare purane sessions band
    await RefreshTokenModel.destroy({ where: { userId: user.id } });

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid refresh token(Server)", error });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both fields required" });
    }
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: " User Not found!" });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password incorrect" });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // saare devices ke refresh tokens hata do - sab jagah dobara login karna hoga
    await RefreshTokenModel.destroy({ where: { userId: user.id } });

    res.status(200).json({ message: "Password change succesfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

const logoutUser = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "No Refresh Token" });
    }
    await RefreshTokenModel.destroy({
      where: { token: refreshToken },
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error during logout", error });
  }
};

export {
  getMe,
  registerUser,
  loginUser,
  refeshAT,
  forgotPswd,
  resetPassword,
  changePassword,
  logoutUser,
};
