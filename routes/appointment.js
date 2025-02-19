import { authMiddleware } from "../middleware/auth.js"; // ✅ Correct
import { postponeAppointment } from "../controllers/appointment.js";
import express from "express";

const router = express.Router();

router.put("/:appointmentId/postpone", authMiddleware, postponeAppointment);

export default router;