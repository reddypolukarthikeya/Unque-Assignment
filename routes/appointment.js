const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment');
const Professor = require('../models/Professor');
const authenticateStudent = require('../middleware/authenticateStudent');

router.put('/:appointmentId/postpone', authenticateStudent, async (req, res) => {
  const { appointmentId } = req.params;
  const { newTime } = req.body; // Expecting newTime in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
  const studentId = req.user.id; // Authenticated student's ID

  try {
    // Validate newTime format
    if (!newTime || isNaN(Date.parse(newTime))) {
      return res.status(400).json({ message: 'Invalid date format. Use ISO 8601 (YYYY-MM-DDTHH:mm:ssZ).' });
    }

    // Convert newTime to Date object
    const newDateTime = new Date(newTime);

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Check if the appointment belongs to the authenticated student
    if (appointment.studentId.toString() !== studentId) {
      return res.status(403).json({ message: 'Unauthorized action.' });
    }

    // Ensure postponement is requested at least 24 hours in advance
    const currentDateTime = new Date();
    const originalAppointmentDateTime = new Date(appointment.time); // Stored as a Date object
    const timeDifference = originalAppointmentDateTime - currentDateTime;
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return res.status(400).json({ message: 'Postponement must be requested at least 24 hours in advance.' });
    }

    // Check professor's availability at the new time
    const isAvailable = await checkProfessorAvailability(appointment.professorId, newDateTime);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Professor is not available at the requested time.' });
    }

    // Update the appointment
    appointment.previousTime = appointment.time; // Store the old time
    appointment.time = newDateTime; // Save new time
    appointment.status = 'postponed';

    await appointment.save();

    res.json({
      message: 'Appointment postponed successfully.',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Function to check professor's availability
async function checkProfessorAvailability(professorId, newDateTime) {
  const professor = await Professor.findById(professorId);
  if (!professor) {
    throw new Error('Professor not found.');
  }

  // Check if the professor has the requested time slot available
  const isAvailable = professor.availability.some(
    (slot) => new Date(slot.time).toISOString() === newDateTime.toISOString()
  );

  return isAvailable;
}

module.exports = router;