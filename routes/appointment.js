import express from "express";
import { postponeAppointment } from "../controllers/appointment.js";
import { authMiddleware as authenticateStudent } from "../middleware/auth.js";

const router = express.Router();

router.put("/:appointmentId/postpone", authMiddleware, postponeAppointment);

export default router;