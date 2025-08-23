import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import nocache from "nocache";
import responseHandler from "./middlewares/responseHandler.js";
import connectMongo from "./config/db.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import nurseRoutes from "./routes/nurseRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import medicationRoutes from  "./routes/medicationRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import memvoiceRoutes from "./routes/memvoiceRoutes.js";
import { attachIO, startAgenda } from "./middlewares/agenda.js";

import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const server = http.createServer(app); // Create server manually
const io = new Server(server, {
  cors: {
    origin: "*", // TODO: restrict to frontend domain in production
    methods: ["GET", "POST"]
  }
});

// Make io accessible inside routes
app.set("io", io);
attachIO(io);
await startAgenda();

app.use(helmet());
app.use(hpp());
app.use(nocache());
app.use(responseHandler);
app.use((req, res, next) => {
    console.log(req.url, req.method);
    next();
});
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin || "*");
    },
    credentials: true,
    methods: ["GET", "POST"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/doctor', doctorRoutes);
app.use('/nurse', nurseRoutes);
app.use('/patient', patientRoutes);
app.use('/member', memberRoutes);
app.use('/admin', adminRoutes);
app.use('/notification', notificationRoutes);
app.use('/medication', medicationRoutes);
app.use('/voice', voiceRoutes);
app.use('/memvoice', memvoiceRoutes);

connectMongo();

app.use((err, req, res, next) => {
  console.error("Error encountered:", err);
  res.status(500).send('Something went wrong!');
});

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("joinPatient", (patientId) => {
    socket.join(String(patientId));
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
