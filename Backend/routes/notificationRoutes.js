import express from "express";
import Notification from "../models/notification.js";
import safeHandler from "../middlewares/safeHandler.js";
import Patient from "../models/patient.js";

const router = express.Router();

router.post(
  "/register",
  safeHandler(async (req, res) => {
    const { message, uploadedAt, alert, patient } = req.body;

    if (!message || !patient) {
      return res.error(400, "Message and Patient ID are required", "VALIDATION_ERROR");
    }

    const existingPatient = await Patient.findById(patient);
    if (!existingPatient) {
      return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
    }

    const newNotification = await Notification.create({
      message,
      uploadedAt: uploadedAt || Date.now(),
      alert: alert || "green",
      patient,
      success: false,
    });

    existingPatient.notification.push(newNotification._id);
    await existingPatient.save();

    return res.success(201, "Notification registered successfully", {
      notification: newNotification,
      patient: existingPatient,
    });
  })
);

export default router;
