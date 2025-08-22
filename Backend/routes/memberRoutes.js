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
}).single('image'); 

router.post("/register/:id", (req, res) => {
  upload(req, res, safeHandler(async (err) => {
    if (err) return res.error(500, err.message);

    try {
      const patientId = req.params.id;
      const { fullname, email, password, contactno, role } = req.body;

      if (!fullname || !email || !password || !contactno || !role) {
        return res.error(400, "All fields are required", "VALIDATION_ERROR");
      }

      const existingMember = await Member.findOne({ email });
      if (existingMember) {
        return res.error(409, "Email already exists", "EMAIL_EXISTS");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let imageDoc = null;
      if (req.file) {
        imageDoc = await Image.create({ url: req.file.location });
      }

      const newMember = await Member.create({
        fullname,
        email,
        password: hashedPassword,
        contactno,
        role,
        image: imageDoc ? imageDoc._id : null,
      });

      const updatedPatient = await Patient.findByIdAndUpdate(
        patientId,
        { $push: { member: newMember._id } },
        { new: true }
      );

      if (!updatedPatient) {
        return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
      }

      return res.status(201).send({
        message: "Member registered and linked to patient successfully",
        data: {
          member: newMember,
          patient: updatedPatient,
          image: imageDoc, 
        },
      });
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  }));
});

router.post(
  "/:id/voice",
  (req, res) => {
    voiceUpload(req, res, safeHandler(async (err) => {
      if (err) return res.error(500, err.message);

      const patientId = req.params.id;
      const { memberName } = req.body;

      if (!memberName) {
        return res.error(400, "Member name is required", "VALIDATION_ERROR");
      }

      if (!req.file) {
        return res.error(400, "Voice file is required", "VALIDATION_ERROR");
      }

      const voiceDoc = await Voice.create({
        memberName,
        url: req.file.location,
      });

      const updatedPatient = await Patient.findByIdAndUpdate(
        patientId,
        { $push: { voice: voiceDoc._id } },
        { new: true }
      );

      if (!updatedPatient) {
        return res.error(404, "Patient not found", "PATIENT_NOT_FOUND");
      }

      return res.success(201, "Voice saved and linked to patient successfully", {
        voice: {
          _id: voiceDoc._id,
          memberName: voiceDoc.memberName,
          url: voiceDoc.url,
        },
        patient: updatedPatient,
      });
    }));
  }
);


router.get(
  "/:id",
  safeHandler(async (req, res) => {
    const memberId = req.params.id;

    const member = await Member.findById(memberId)
      .select("fullname email contactno role image")
      .populate("image", "url"); 

    if (!member) {
      return res.error(404, "Member not found", "MEMBER_NOT_FOUND");
    }

    const memberDetails = {
      id: member._id,
      fullname: member.fullname,
      email: member.email,
      contactno: member.contactno,
      role: member.role,
      image: member.image ? member.image.url : null, 
    };

    return res.success(200, "Member details fetched successfully", {
      member: memberDetails,
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
