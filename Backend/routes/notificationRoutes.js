import express from "express";
import Notification from "../models/notification.js";
import safeHandler from "../middlewares/safeHandler.js";
import Patient from "../models/patient.js";
import Doctor from "../models/doctor.js";

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

router.get(
  "/doctor/:id",
  safeHandler(async (req, res) => {
    const doctorId = req.params.id;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.error(404, "Doctor not found", "DOCTOR_NOT_FOUND");
    }

    const patients = await Patient.find({ doctor: doctorId });

    if (!patients || patients.length === 0) {
      return res.success(200, "No patients found for this doctor", { patients: [] });
    }

    const patientsWithNotifications = await Promise.all(
      patients.map(async (patient) => {
        const notifications = await Notification.find({ patient: patient._id });
        return {
          ...patient.toObject(),
          notifications,
        };
      })
    );

    return res.success(200, "Patients with notifications fetched successfully", {
      patients: patientsWithNotifications,
    });
  })
);


router.get(
  "/nurse/:id",
  safeHandler(async (req, res) => {
    const nurseId = req.params.id;

    const nurse = await Nurse.findById(nurseId);
    if (!nurse) {
      return res.error(404, "Nurse not found", "NURSE_NOT_FOUND");
    }

    const patients = await Patient.find({ nurse: nurseId });

    if (!patients || patients.length === 0) {
      return res.success(200, "No patients found for this nurse", { patients: [] });
    }

    const patientsWithNotifications = await Promise.all(
      patients.map(async (patient) => {
        const notifications = await Notification.find({ patient: patient._id });
        return {
          ...patient.toObject(),
          notifications,
        };
      })
    );

    return res.success(200, "Patients with notifications fetched successfully", {
      patients: patientsWithNotifications,
    });
  })
);


export default router;
