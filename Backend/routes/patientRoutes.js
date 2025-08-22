import express from "express";
import safeHandler from "../middlewares/safeHandler.js";
import Patient from "../models/patient.js";
import Doctor from "../models/doctor.js";
import Nurse from "../models/nurse.js";
import Notification from "../models/notification.js";
import Image from "../models/image.js";

import dotenv from "dotenv";
import aws from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";

dotenv.config();

const router = express.Router();
const spacesEndpoint = new aws.Endpoint(process.env.DO_SPACES_ENDPOINT);

const s3 = new aws.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.DO_SPACES_BUCKET,
    acl: "public-read",
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
    contentType: (req, file, cb) => {
      cb(null, file.mimetype);
    },
  }),
}).single("image");


router.post(
  "/register",
  (req, res) => {
    upload(req, res, safeHandler(async (err) => {
      if (err) return res.status(500).send({ error: err.message });

      try {
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
          nurseEmails,
          image
        } = req.body;

        const doctor = await Doctor.findOne({ email: doctorEmail });
        if (!doctor) {
          return res.error(404, "Doctor not found", "DOCTOR_NOT_FOUND");
        }

        const nurses = await Nurse.find({ email: { $in: nurseEmails } });
        if (!nurses || nurses.length === 0) {
          return res.error(404, "No nurses found", "NURSES_NOT_FOUND");
        }

        let imageDoc = null;
        if (req.file) {
          imageDoc = await Image.create({ url: req.file.location });
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
          nurse: nurses.map((n) => n._id),
          image: imageDoc ? imageDoc._id : null,
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
          message: "Patient added",
          alert: "green",
          success: true,
          patient: patient._id,
          createdAt: new Date(),
        });

        await notification.save();
        await patient.updateOne({
          $push: { newNotification: notification._id },
        });

        return res.status(201).send({
          message: "Patient registered successfully",
          data: {
            patient,
            notification,
            image: imageDoc,
          },
        });
      } catch (error) {
        return res.status(500).send({ error: error.message });
      }
    }));
  }
);


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

    const patient = await Patient.findById(id).select(
      "fullname dob assigned_bed image"
    );
    if (!patient) {
      return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
    }

    const image = await Image.findById(patient.image);

    return res.success(200, "Patient details fetched successfully", {
      name: patient.fullname,
      dob: patient.dob,
      bed: patient.assigned_bed,
      image: image ? image.url : null,
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
