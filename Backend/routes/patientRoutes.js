import express from "express";
import { safeHandler } from "../middlewares/safeHandler.js";
import Patient from "../models/patient.js";
import Doctor from "../models/doctor.js";
import Nurse from "../models/nurse.js";

const router = express.Router();

router.post("/register", safeHandler(async (req, res) => {
  const {
    fullname,
    email,
    contactno_Primary,
    contactno_Secondary,
    gender,
    dob,
    assigned_bed,
    address,
    doctorEmail,
    nurseEmails
  } = req.body;


  const doctor = await Doctor.findOne({ email: doctorEmail });
  if (!doctor) {
    return res.error(404, "Doctor not found", "DOCTOR_NOT_FOUND");
  }

  const nurses = await Nurse.find({ email: { $in: nurseEmails } });
  if (!nurses || nurses.length === 0) {
    return res.error(404, "No nurses found", "NURSES_NOT_FOUND");
  }

  const patient = new Patient({
    fullname,
    email,
    contactno_Primary,
    contactno_Secondary,
    gender,
    dob,
    assigned_bed,
    address,
    doctor: doctor._id,
    nurse: nurses.map(n => n._id)
  });

  await patient.save();

  doctor.patients = doctor.patients || [];
  doctor.patients.push(patient._id);
  await doctor.save();

  for (let nurse of nurses) {
    nurse.patients = nurse.patients || [];
    nurse.patients.push(patient._id);
    await nurse.save();
  }

  return res.success(201, "Patient registered successfully", { patient });
}));

export default router;
