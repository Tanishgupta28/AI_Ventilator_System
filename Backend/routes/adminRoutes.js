import express from "express";
import bcrypt from "bcrypt";
import Admin from "../models/admin.js";
import { generateToken } from "../utils/jwtFunct.js";
import safeHandler from "../middlewares/safeHandler.js";

const router = express.Router();

router.post(
  "/register",
  safeHandler(async (req, res) => {
    const { fullname, email, password, contactno, gender } = req.body;

    if (!fullname || !email || !password || !contactno || !gender) {
      return res.error(400, "All fields are required", "VALIDATION_ERROR");
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.error(409, "Email already exists", "EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      fullname,
      email,
      password: hashedPassword,
      contactno,
      gender,
    });

    const token = generateToken({ id: newAdmin._id, role: "admin" });

    return res.success(201, "Admin registered successfully", {
      admin: newAdmin,
      token,
    });
  })
);

router.post(
  "/login",
  safeHandler(async (req, res) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.error(404, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.error(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const token = generateToken({ id: admin._id, role: "admin" });

    return res.success(200, "Admin login successful", {
      token,
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  })
);

export default router;