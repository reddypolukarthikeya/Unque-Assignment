import { Appointment } from "../models/appointment.js";
import { Availability } from "../models/availability.js";

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

// Function to check professor's availability using the Availability model
async function checkProfessorAvailability(professorId, newTime) {
  const requestTime = new Date(newTime).getTime();

  try {
    const slot = await Availability.findOne({
      professorId,
      startTime: { $lte: newTime }, // New time should be after or at startTime
      endTime: { $gt: newTime }, // New time should be before endTime
    });

    console.log(`Checking availability for ${newTime}:`, slot ? "Available" : "Not Available");
    return !!slot; // Returns true if a slot exists, false otherwise
  } catch (error) {
    console.error("Error checking availability:", error.message);
    return false;
  }
}