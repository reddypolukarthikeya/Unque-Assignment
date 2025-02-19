import { Appointment } from "../models/appointment.js";
import { User as Professor } from "../models/user.js"; // Assuming the Professor is stored in the User model

export const postponeAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { newTime } = req.body;
  const studentId = req.user.id; // Authenticated student's ID

  try {
    // Validate newTime format
    if (!newTime || isNaN(Date.parse(newTime))) {
      return res.status(400).json({ message: "Invalid date format. Use ISO 8601: YYYY-MM-DDTHH:mm:ssZ" });
    }

    const newTimeDate = new Date(newTime);

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Check if the appointment belongs to the authenticated student
    if (appointment.studentId.toString() !== studentId) {
      return res.status(403).json({ message: "Unauthorized action." });
    }

    // Ensure the postponement is at least 24 hours in advance
    const currentDateTime = new Date();
    const hoursDifference = (appointment.time - currentDateTime) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return res.status(400).json({ message: "Postponement must be requested at least 24 hours in advance." });
    }

    // Check professor's availability at the new time
    const isAvailable = await checkProfessorAvailability(appointment.professorId, newTimeDate);
    if (!isAvailable) {
      return res.status(400).json({ message: "Professor is not available at the requested time." });
    }

    // Update the appointment
    appointment.previousTime = appointment.time;
    appointment.time = newTimeDate;
    appointment.status = "postponed";
    await appointment.save();

    res.json({
      message: "Appointment postponed successfully.",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// Function to check professor's availability
async function checkProfessorAvailability(professorId, newTime) {
  const professor = await Professor.findById(professorId);
  if (!professor) {
    throw new Error("Professor not found.");
  }

  // Check if any availability slot matches the requested time
  return professor.availability.some((slot) => new Date(slot.time).toISOString() === newTime.toISOString());
}