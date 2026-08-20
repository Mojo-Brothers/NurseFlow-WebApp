import { appointmentQueueService } from '../services/appointmentQueue.service.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';

export const appointmentController = {
  /**
   * GET /api/v1/appointments
   */
  async getAppointments(req, res) {
    try {
      const appointments = Array.from(appointmentQueueService.appointments.values());
      return res.status(200).json({
        success: true,
        data: appointments,
        total: appointments.length
      });
    } catch (error) {
      structuredLoggerService.error('APPOINTMENT_GET_ALL_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/appointments/book
   */
  async book(req, res) {
    try {
      const record = appointmentQueueService.bookAppointment(req.body);
      return res.status(201).json({
        success: true,
        data: record,
        message: 'Appointment successfully booked.'
      });
    } catch (error) {
      structuredLoggerService.error('APPOINTMENT_BOOK_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/appointments/check-in
   */
  async checkIn(req, res) {
    try {
      const { appointmentId } = req.body;
      const result = appointmentQueueService.checkInPatient(appointmentId);
      const apt = appointmentQueueService.getAppointment(appointmentId);
      return res.status(200).json({
        success: true,
        data: {
          ...apt,
          ...result,
          status: apt.status,
          queueNumber: result.ticketNumber
        },
        message: 'Patient successfully checked in.'
      });
    } catch (error) {
      structuredLoggerService.error('APPOINTMENT_CHECKIN_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/appointments/cancel
   */
  async cancel(req, res) {
    try {
      const { appointmentId, reason } = req.body;
      const record = appointmentQueueService.cancelAppointment(appointmentId, reason);
      return res.status(200).json({
        success: true,
        data: record,
        message: 'Appointment cancelled.'
      });
    } catch (error) {
      structuredLoggerService.error('APPOINTMENT_CANCEL_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  }
};
