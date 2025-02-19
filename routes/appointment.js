const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment');
const Professor = require('../models/Professor');
const authenticateStudent = require('../middleware/authenticateStudent');

router.put('/:appointmentId/postpone', authenticateStudent, async (req, res) => {
  const { appointmentId } = req.params;
  const { newDate, newTime } = req.body;
  const studentId = req.user.id; // Assuming the student's ID is stored in req.user.id after authentication

  try {
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Check if the appointment belongs to the authenticated student
    if (appointment.studentId.toString() !== studentId) {
      return res.status(403).json({ message: 'Unauthorized action.' });
    }

    // Check if the postponement is requested at least 24 hours in advance
    const currentDateTime = new Date();
    const originalAppointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const timeDifference = originalAppointmentDateTime - currentDateTime;
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    if (hoursDifference < 24) {
      return res.status(400).json({ message: 'Postponement must be requested at least 24 hours in advance.' });
    }

    // Check professor's availability at the new date and time
    const isAvailable = await checkProfessorAvailability(appointment.professorId, newDate, newTime);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Professor is not available at the requested time.' });
    }

    // Update the appointment
    appointment.date = newDate;
    appointment.time = newTime;
    appointment.status = 'Postponed';
    await appointment.save();

    res.json({
      message: 'Appointment postponed successfully.',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error });
  }
});

// Function to check professor's availability
async function checkProfessorAvailability(professorId, date, time) {
  // Implement logic to check if the professor is available at the given date and time
  // This might involve querying the Professor's availability schedule from the database
  // For simplicity, let's assume the function returns true if available, false otherwise
  const professor = await Professor.findById(professorId);
  if (!professor) {
    throw new Error('Professor not found.');
  }

  // Example: Check if the professor has the requested time slot available on the given date
  // This is a placeholder implementation; adjust it based on your actual data structure
  const availability = professor.availability.find(
    (slot) => slot.date === date && slot.time === time
  );

  return !!availability;
}

module.exports = router;