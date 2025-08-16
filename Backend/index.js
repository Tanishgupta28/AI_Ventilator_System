import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import nocache from "nocache";
import responseHandler from "./middlewares/responseHandler.js";
import connectMongo from "./config/db.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(helmet());
app.use(hpp());
app.use(nocache());
app.use(responseHandler);
app.use((req, res, next) => {
    console.log(req.url, req.method);
    next();
})
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




connectMongo();

app.use((err, req, res, next) => {
  console.error("Error encountered:", err);
  res.status(500).send('Something went wrong!');
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});