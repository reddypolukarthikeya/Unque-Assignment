import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import { notFound, errorMiddleware } from "./middleware/error.js";

import userRoutes from "./routes/user.js";
import professorRoutes from "./routes/proff.js";
import generalRoutes from "./routes/general.js";
import appointmentRoutes from "./routes/appointment.js"; // Import the new appointment routes

dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// Register Routes
app.use("/users", userRoutes);
app.use("/professor", professorRoutes);
app.use("/general", generalRoutes);
app.use("/appointment", appointmentRoutes); // Ensure this is added

// Error Handling Middleware
app.use(notFound);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5001;
mongoose
  .connect(process.env.MONGO_URL, {})
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
  })
  .catch((error) => console.log(`${error} did not connect`));