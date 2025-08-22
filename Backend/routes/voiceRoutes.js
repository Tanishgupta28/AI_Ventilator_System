import express from "express";
import safeHandler from "../middlewares/safeHandler.js";
import Patient from "../models/patient.js";
import Voice from "../models/voice.js";
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
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    },
    contentType: (req, file, cb) => {
      cb(null, file.mimetype);
    },
  })
}).single('upload');

router.post('/register/:id', (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).send({ error: err.message });

    try {
      const patientId = req.params.id;
      const { text } = req.body;

      if (!req.file || !text) {
        return res.status(400).send({
          error: "Voice file and text are required",
          code: "VALIDATION_ERROR"
        });
      }

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).send({
          error: "Patient not found",
          code: "PATIENT_NOT_FOUND"
        });
      }

      const newVoice = await Voice.create({
        patient: patientId,
        voice: req.file.location,
        text,
      });

      patient.voice.push(newVoice._id);
      await patient.save();

      return res.status(201).send({
        message: "Voice added and linked to patient successfully",
        data: {
          voice: newVoice,
          patient,
        },
      });
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  });
});

router.get('/:id', safeHandler(async (req, res) => {
  const patientId = req.params.id;
  const patient = await Patient.findById(patientId)
    .select("voice")
    .populate("voice");

  if (!patient) {
    return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
  }

  return res.success(200, "Voice details fetched successfully", patient.voice);
}));


export default router;
