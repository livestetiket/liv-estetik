const express = require("express");
const receptionController = require("../controllers/reception_controller");
const adminController = require("../controllers/admin_controller");
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
const { createVisitSchema, generateReportSchema } = require("../validators/activity_validator");
const { createTestimonialSchema, updateTestimonialSchema } = require("../validators/content_validator");

const router = express.Router();

// All reception routes require an authenticated reception or admin user.
router.use(requireAuth, requireRole("reception", "admin"));

router.get("/dashboard", receptionController.getDashboard);
router.get("/services", adminController.listServices);
router.get("/testimonials", adminController.listTestimonials);
router.post("/testimonials", validateBody(createTestimonialSchema), adminController.createTestimonial);
router.patch("/testimonials/:id", validateBody(updateTestimonialSchema), adminController.updateTestimonial);
router.delete("/testimonials/:id", adminController.deleteTestimonial);

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
router.patch("/bookings/:id/status", validateBody(z.object({ status: z.enum(["arrived", "in_progress", "completed"]) })), receptionController.updateBookingStatus);
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

router.get("/visits", operationsController.listVisits);
router.post("/visits", validateBody(createVisitSchema), operationsController.createVisit);
router.get("/reports/preview", operationsController.reportPreview);
router.post("/reports/generate", validateBody(generateReportSchema), operationsController.generateReport);
router.get("/reports", operationsController.listReports);
router.post("/reports/:id/share-opened", requireRole("admin"), operationsController.markShareOpened);
router.get("/reports/export.csv", requireRole("admin"), operationsController.exportReportCsv);

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
