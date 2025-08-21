import express from "express";
import safeHandler from "../middlewares/safeHandler.js";
import Patient from "../models/patient.js";
import Doctor from "../models/doctor.js";
import Nurse from "../models/nurse.js";
import Notification from "../models/notification.js";

const router = express.Router();

router.post("/register", safeHandler(async (req, res) => {
  console.log(req.body)
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

  const notification = new Notification({
    message: "Patient added ",
    alert: "green",      
    success: true, 
    patient: patient._id,     
    createdAt: new Date()
  });

  await notification.save();
  await patient.updateOne({
    $push: { newNotification: notification._id }
  });

  return res.success(201, "Patient registered successfully", { 
    patient,
    notification
  });
}));


router.get(
  "/:patientId/notification/:notificationId",
  safeHandler(async (req, res) => {
    const { patientId, notificationId } = req.params;

    const patient = await Patient.findById(patientId)
      .populate("oldNotification")
      .populate("newNotification");

    if (!patient) {
      return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.error(404, "Notification not found", "NOTIFICATION_NOT_FOUND");
    }

    const sortedNewNotifications = [...(patient.newNotification || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const allNotifications = [
      ...(patient.oldNotification || []),
      ...sortedNewNotifications,
    ];

    return res.success(200, "Patient notification fetched successfully", {
      name: patient.fullname,
      dob: patient.dob,
      bed: patient.assigned_bed,
      alert: notification.alert,
      notifications: allNotifications,
    });
  })
);

router.get(
  "/:id",
  safeHandler(async (req, res) => {
    const { id } = req.params;

    const patient = await Patient.findById(id).select("fullname dob assigned_bed");
    if (!patient) {
      return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
    }

    return res.success(200, "Patient details fetched successfully", {
      name: patient.fullname,
      dob: patient.dob,
      bed: patient.assigned_bed,
    });
  })
);



router.delete(
  "/:patientId",
  safeHandler(async (req, res) => {
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
    }

    if (patient.doctor) {
      await Doctor.findByIdAndUpdate(patient.doctor, {
        $pull: { patients: patient._id },
      });
    }

    if (patient.nurse && patient.nurse.length > 0) {
      await Nurse.updateMany(
        { _id: { $in: patient.nurse } },
        { $pull: { patients: patient._id } }
      );
    }

    await Notification.deleteMany({ patient: patient._id });

    await Patient.findByIdAndDelete(patientId);

    return res.success(200, "Patient and related details deleted successfully");
  })
);

export default router;
