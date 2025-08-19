import express from "express";
import Notification from "../models/notification.js";
import safeHandler from "../middlewares/safeHandler.js";
import Patient from "../models/patient.js";
import Doctor from "../models/doctor.js";
import Nurse from "../models/nurse.js";

const router = express.Router();

router.post(
  "/register",
  safeHandler(async (req, res) => {
    const { message, uploadedAt, alert, patient } = req.body;

    if (!message || !patient) {
      return res.error(
        400,
        "Message and Patient ID are required",
        "VALIDATION_ERROR"
      );
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
      success: true,
    });

    if (alert === "green") {
      existingPatient.oldNotification.push(newNotification._id);
    } else {
      existingPatient.newNotification.push(newNotification._id);
    }

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

    const patients = await Patient.find({ doctor: doctorId }).populate("newNotification");

    if (!patients || patients.length === 0) {
      return res.success(200, "No patients found for this doctor", { patients: [] });
    }

    const patientsWithNewNotifications = patients
      .filter((patient) => patient.newNotification && patient.newNotification.length > 0)
      .map((patient) => ({
        ...patient.toObject(),
        newNotification: patient.newNotification,
      }));

    return res.success(200, "Patients with new notifications fetched successfully", {
      patients: patientsWithNewNotifications,
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

    const patients = await Patient.find({ nurse: nurseId }).populate("newNotification");

    if (!patients || patients.length === 0) {
      return res.success(200, "No patients found for this nurse", { patients: [] });
    }

    const patientsWithNewNotifications = patients.map((patient) => ({
      ...patient.toObject(),
      newNotification: patient.newNotification,
    }));

    return res.success(200, "Patients with new notifications fetched successfully", {
      patients: patientsWithNewNotifications,
    });
  })
);

router.post(
  "/:id",
  safeHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.error(404, "Notification not found", "NOTIFICATION_NOT_FOUND");
    }

    notification.success = true;
    notification.alert = "green";
    await notification.save();

    const patient = await Patient.findById(notification.patient);
    if (!patient) {
      return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
    }

    patient.newNotification = patient.newNotification.filter(
      (nid) => nid.toString() !== notification._id.toString()
    );

    if (!patient.oldNotification.includes(notification._id)) {
      patient.oldNotification.push(notification._id);
    }

    await patient.save();

    return res.success(200, "Notification updated successfully", {
      notification,
      patient,
    });
  })
);

export default router;
