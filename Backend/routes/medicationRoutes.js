import express from "express";
import safeHandler from "../middlewares/safeHandler.js";
import Patient from "../models/patient.js";
import Medication from "../models/medication.js";

const router = express.Router();

router.post(
  "/register/:id",
  safeHandler(async (req, res) => {
    const patientId = req.params.id;
    const { date, msg } = req.body;

    if (!date || !msg) {
      return res.error(400, "Date and message are required", "VALIDATION_ERROR");
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
    }

    const newMedication = await Medication.create({
      patient: patientId,
      date: new Date(date),
      msg,
    });

    patient.medication.push(newMedication._id);
    await patient.save();

    return res.success(
      201,
      "Medication added and linked to patient successfully",
      {
        medication: newMedication,
        patient,
      }
    );
  })
);


router.get(
  "/:id",
  safeHandler(async (req, res) => {
    const patientId = req.params.id;

    const patient = await Patient.findById(patientId).populate("medication");
    if (!patient) {
      return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
    }

    return res.success(200, "Patient details fetched successfully", patient);
  })
);

export default router;
