const express = require("express");
const receptionController = require("../controllers/reception_controller");
const { requireAuth } = require("../middleware/auth_middleware");
const { requireRole } = require("../middleware/role_middleware");
const { validateBody } = require("../middleware/validate_middleware");
const {
  approveBookingSchema,
  rejectBookingSchema,
  rescheduleBookingSchema,
} = require("../validators/booking_validator");
const { blockSlotSchema, createSlotSchema } = require("../validators/slot_validator");
const { updateMessageSchema } = require("../validators/content_validator");
const { z } = require("zod");

const router = express.Router();

// All reception routes require an authenticated reception or admin user.
router.use(requireAuth, requireRole("reception", "admin"));

router.get("/dashboard", receptionController.getDashboard);

router.get("/bookings", receptionController.listBookings);
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
router.patch(
  "/bookings/:id/cancel",
  validateBody(z.object({ reason: z.string().optional() })),
  receptionController.cancelBooking
);
router.patch(
  "/bookings/:id/note",
  validateBody(z.object({ note: z.string().min(1) })),
  receptionController.addNote
);

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