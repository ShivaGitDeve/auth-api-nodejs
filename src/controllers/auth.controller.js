import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Token from "../utils/generateToken.js";

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

    const token = Token(user);
    return res.status(200).json({
      message: "Login succesful",
      token,
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

export { registerUser, loginUser };
