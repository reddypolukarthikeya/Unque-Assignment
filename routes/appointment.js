import express from "express";
import { postponeAppointment } from "../controllers/appointment.js";
import { authMiddleware } from "../middleware/auth.js"; // Ensure the correct import

const router = express.Router();

router.put("/:appointmentId/postpone", authMiddleware, postponeAppointment);

export default router;