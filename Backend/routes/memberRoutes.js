import express from "express";
import bcrypt from "bcrypt";
import Member from "../models/member.js";
import { generateToken } from "../utils/jwtFunct.js";
import safeHandler from "../middlewares/safeHandler.js";

const router = express.Router();

router.post(
  "/register",
  safeHandler(async (req, res) => {
    const { fullname, email, password, contactno, role } = req.body;

    if (!fullname || !email || !password || !contactno || !role) {
      return res.error(400, "All fields are required", "VALIDATION_ERROR");
    }

    const existingMember = await Member.findOne({ email });
    if (existingMember) {
      return res.error(409, "Email already exists", "EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newMember = await Member.create({
      fullname,
      email,
      password: hashedPassword,
      contactno,
      role,
    });

    const token = generateToken({ id: newMember._id, role: newMember.role });

    return res.success(201, "Member registered successfully", {
      member: newMember,
      token,
    });
  })
);


router.post(
  "/login",
  safeHandler(async (req, res) => {
    const { email, password } = req.body;

    const member = await Member.findOne({ email });
    if (!member) {
      return res.error(404, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      return res.error(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const token = generateToken({ id: member._id, role: member.role });

    return res.success(200, "Member login successful", {
      token,
      member: {
        id: member._id,
        email: member.email,
        role: member.role,
      },
    });
  })
);

export default router;