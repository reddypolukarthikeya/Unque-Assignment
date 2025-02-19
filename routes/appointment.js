import express from "express";
import { postponeAppointment } from "../controllers/appointment.js";
import authenticateStudent from "../middleware/authenticateStudent.js";

const router = express.Router();

router.put("/:appointmentId/postpone", authenticateStudent, postponeAppointment);

export default router;