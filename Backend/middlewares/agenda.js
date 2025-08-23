// middlewares/agenda.js
import Agenda from "agenda";
import Medication from "../models/medication.js";
import Notification from "../models/notification.js";
import dotenv from "dotenv";

dotenv.config();

const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
  processEvery: "30 seconds", // check jobs frequently
});

let agendaStarted = false;
let ioRef = null; // for websockets (socket.io)

// Attach socket.io instance
export function attachIO(io) {
  ioRef = io;
}

export async function startAgenda() {
  if (!agendaStarted) {
    await agenda.start();
    agendaStarted = true;
    console.log("✅ Agenda started");
  }
}

// Define the notification job
agenda.define("daily medication notification", async (job) => {
  const { medicationId } = job.attrs.data;

  const med = await Medication.findById(medicationId).populate("patient");
  if (!med || !med.patient) return;

  const patient = med.patient;

  const newNotification = await Notification.create({
    message: med.msg,
    uploadedAt: Date.now(),
    alert: "yellow",
    patient: patient._id,
    success: false,
  });

  patient.newNotification.push(newNotification._id);
  await patient.save();

  // Emit websocket event
  if (ioRef) {
    ioRef.emit("newNotification", {
      patientId: String(patient._id),
      notification: {
        _id: String(newNotification._id),
        message: newNotification.message,
        alert: newNotification.alert,
        uploadedAt: newNotification.uploadedAt,
      },
    });
  }

  console.log(`💊 Daily notification created for patient ${patient._id}`);
});

/**
 * Schedule one medication to run every day at its given time.
 * Uses "24 hours" repeat with a startDate set to the medication time.
 */
export async function scheduleMedicationJob(medicationDoc) {
  await startAgenda();
  console.log(medicationDoc);

  const d = new Date(medicationDoc.date);
  console.log(`⏰ Scheduled medication ${medicationDoc._id} daily at ${d}`);

  // Create a job starting at the medication time, repeating daily
  const job = agenda
    .create("daily medication notification", { medicationId: medicationDoc._id })
    .unique({ "data.medicationId": medicationDoc._id }) // avoid duplicates
    .repeatEvery("24 hours", {
      skipImmediate: true, // don’t fire instantly, wait until scheduled time
      timezone: process.env.TZ || "Asia/Kolkata",
    });

  // Start running at the first date
  job.schedule(d);

  await job.save();

  console.log(`⏰ Scheduled medication ${medicationDoc._id} daily at ${d}`);
}

export default agenda;
