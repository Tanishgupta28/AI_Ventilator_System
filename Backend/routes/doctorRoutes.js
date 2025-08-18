import express from "express";
import bcrypt from "bcrypt";
import Doctor from "../models/doctor.js";
import Patient from "../models/patient.js";
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

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.error(409, "Email already exists", "EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDoctor = await Doctor.create({
      fullname,
      email,
      password: hashedPassword,
      contactno,
      gender,
    });

    const token = generateToken({ id: newDoctor._id, role: "doctor" });

    return res.success(201, "Doctor registered successfully", {
      doctor: newDoctor,
      token,
    });
  })
);

router.post(
  "/login",
  safeHandler(async (req, res) => {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.error(404, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.error(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const token = generateToken({ id: doctor._id, role: "doctor" });

    return res.success(200, "Doctor login successful", {
      token,
      doctor: {
        id: doctor._id,
        email: doctor.email,
      },
    });
  })
);

export default router;