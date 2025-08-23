import express from "express";
import safeHandler from "../middlewares/safeHandler.js";
import Patient from "../models/patient.js";
import Member from "../models/member.js";
import Image from "../models/image.js";
import dotenv from "dotenv";
import aws from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";
import bcrypt from "bcrypt";
import Voice from "../models/voice.js";

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
}).single('voice');

router.post("/voice/:id", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.error(500, err.message);
    }

    try {
      const memberId = req.params.id;

      const member = await Member.findById(memberId).populate("patient");
      if (!member) {
        return res.error(404, "Member not found", "MEMBER_NOT_FOUND");
      }

      if (!req.file) {
        return res.error(400, "Voice file is required", "VALIDATION_ERROR");
      }

      const voiceDoc = await Voice.create({
        text: member.fullname,
        voice: req.file.location,
        patient: member.patient,
      });

      if (member.patient) {
        await Patient.findByIdAndUpdate(
          member.patient,
          { $push: { membervoice: voiceDoc._id } },
          { new: true }
        );
      }

      await Member.findByIdAndUpdate(
        memberId,
        { $push: { membervoice: voiceDoc._id } },
        { new: true }
      );

      return res.success(201, "Voice saved and linked successfully", {
        voice: {
          _id: voiceDoc._id,
          text: voiceDoc.text,
          url: voiceDoc.voice,
        },
        member: {
          id: member._id,
          fullname: member.fullname,
        },
        patient: member.patient,
      });
    } catch (error) {
      return res.error(500, error.message);
    }
  });
});



router.get('/member/:id', safeHandler(async (req, res) => {
  const memberId = req.params.id;

  const member = await Member.findById(memberId)
    .populate({
      path: "patient",
      select: "fullname"
    })
    .populate({
      path: "membervoice",
      select: "voice text"
    });

  if (!member) {
    return res.error(404, "Member not found", "MEMBER_NOT_FOUND");
  }

  const memberDetails = {
    id: member._id,
    patientName: member.patient ? member.patient.fullname : null,
    membervoice: member.membervoice.map(v => ({
      id: v._id,
      text: v.text,
      url: v.voice
    }))
  };

  return res.success(200, "Member details fetched successfully", {
    member: memberDetails,
  });
}));



router.get('/patient/:id', safeHandler(async (req, res) => {
  const patientId = req.params.id;

  const patient = await Patient.findById(patientId)
    .populate({
      path: "membervoice",
      select: "voice text"
    });

  if (!patient) {
    return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
  }

  const patientDetails = {
    id: patient._id,
    fullname: patient.fullname,
    membervoice: patient.membervoice.map(v => ({
      id: v._id,
      text: v.text,
      url: v.voice
    }))
  };

  return res.success(200, "Patient details fetched successfully", {
    patient: patientDetails,
  });
}));
export default router;