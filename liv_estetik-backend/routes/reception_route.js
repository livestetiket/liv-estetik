const express = require("express");
const receptionController = require("../controllers/reception_controller");
const { requireAuth } = require("../middleware/auth_middleware");
const { requireRole } = require("../middleware/role_middleware");
const { validateBody } = require("../middleware/validate_middleware");
const {
  approveBookingSchema,
  rejectBookingSchema,
  rescheduleBookingSchema,
  createReceptionBookingSchema,
} = require("../validators/booking_validator");
const { blockSlotSchema, createSlotSchema } = require("../validators/slot_validator");
const { updateMessageSchema } = require("../validators/content_validator");
const { z } = require("zod");
const operationsController = require("../controllers/operations_controller");
const { createCallSchema, updateCallSchema } = require("../validators/activity_validator");

const router = express.Router();

// All reception routes require an authenticated reception or admin user.
router.use(requireAuth, requireRole("reception", "admin"));

router.get("/dashboard", receptionController.getDashboard);

router.get("/bookings", receptionController.listBookings);
router.post("/bookings", validateBody(createReceptionBookingSchema), receptionController.createBooking);
router.get("/patients/lookup", receptionController.lookupPatient);
router.get("/bookings/:id", receptionController.getBooking);
router.patch(
  "/bookings/:id/approve",
  validateBody(approveBookingSchema),
  receptionController.approveBooking
);
router.patch(
  "/bookings/:id/reject",
  validateBody(rejectBookingSchema),
  receptionController.rejectBooking
);
router.patch(
  "/bookings/:id/reschedule",
  validateBody(rescheduleBookingSchema),
  receptionController.rescheduleBooking
);
router.patch("/bookings/:id/complete", receptionController.completeBooking);
router.patch("/bookings/:id/status", validateBody(z.object({ status: z.enum(["arrived", "in_progress", "completed", "no_show"]) })), receptionController.updateBookingStatus);
router.patch(
  "/bookings/:id/cancel",
  validateBody(z.object({ reason: z.string().trim().min(2, "Cancellation reason is required") })),
  receptionController.cancelBooking
);
router.patch(
  "/bookings/:id/note",
  validateBody(z.object({ note: z.string().min(1) })),
  receptionController.addNote
);

router.get("/calls", operationsController.listCalls);
router.post("/calls", validateBody(createCallSchema), operationsController.createCall);
router.patch("/calls/:id", validateBody(updateCallSchema), operationsController.updateCall);

router.get("/messages", receptionController.listMessages);
router.patch(
  "/messages/:id",
  validateBody(updateMessageSchema),
  receptionController.updateMessage
);

router.get("/time-slots", receptionController.listTimeSlots);
router.post("/time-slots", validateBody(createSlotSchema), receptionController.createTimeSlot);
router.patch(
  "/time-slots/:id/block",
  validateBody(blockSlotSchema),
  receptionController.blockSlot
);
router.patch("/time-slots/:id/unblock", receptionController.unblockSlot);

module.exports = router;
