import express from "express";
import bcrypt from "bcrypt";
import Nurse from "../models/nurse.js";
import Patient from "../models/patient.js";
import { generateToken } from "../utils/jwtFunct.js";
import { safeHandler } from "../middlewares/safeHandler.js";

const router = express.Router();



router.post(
  "/register",
  safeHandler(async (req, res) => {
    const { fullname, email, password, contactno, gender } = req.body;

    if (!fullname || !email || !password || !contactno || !gender) {
      return res.error(400, "All fields are required", "VALIDATION_ERROR");
    }

    const existingNurse = await Nurse.findOne({ email });
    if (existingNurse) {
      return res.error(409, "Email already exists", "EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newNurse = await Nurse.create({
      fullname,
      email,
      password: hashedPassword,
      contactno,
      gender,
    });

    const token = generateToken({ id: newNurse._id, role: "nurse" });

    return res.success(201, "Nurse registered successfully", {
      nurse: newNurse,
      token,
    });
  })
);

router.post(
  "/login",
  safeHandler(async (req, res) => {
    const { email, password } = req.body;

    const nurse = await Nurse.findOne({ email });
    if (!nurse) {
      return res.error(404, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(password, nurse.password);
    if (!isMatch) {
      return res.error(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const token = generateToken({ id: nurse._id, role: "nurse" });

    return res.success(200, "Nurse login successful", {
      token,
      nurse: {
        id: nurse._id,
        email: nurse.email,
        role: nurse.role,
      },
    });
  })
);

export default router;