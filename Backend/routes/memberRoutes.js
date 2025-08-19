import express from "express";
import bcrypt from "bcrypt";
import Member from "../models/member.js";
import { generateToken } from "../utils/jwtFunct.js";
import safeHandler from "../middlewares/safeHandler.js";
import Patient from "../models/patient.js";

const router = express.Router();

router.post(
  "/register/:id",
  safeHandler(async (req, res) => {
    const { fullname, email, password, contactno, role } = req.body;
    const patientId = req.params.id;

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

    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      {
        $push: {
          members: {
            memberId: newMember._id, 
            fullname: newMember.fullname,
            email: newMember.email,
            contactno: newMember.contactno,
            role: newMember.role,
          },
        },
      },
      { new: true } 
    );

    if (!updatedPatient) {
      return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
    }

    return res.success(201, "Member registered and linked to patient successfully", {
      member: newMember,
      patient: updatedPatient,
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