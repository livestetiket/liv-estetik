const express = require("express");
const adminController = require("../controllers/admin_controller");
const receptionController = require("../controllers/reception_controller");
const { requireAuth } = require("../middleware/auth_middleware");
const { requireRole } = require("../middleware/role_middleware");
const { validateBody } = require("../middleware/validate_middleware");
const { createUserSchema, updateUserSchema, resetPasswordSchema } = require("../validators/user_validator");
const { createServiceSchema, updateServiceSchema } = require("../validators/service_validator");
const { createSlotSchema, updateSlotSchema } = require("../validators/slot_validator");
const {
  createTestimonialSchema,
  updateTestimonialSchema,
} = require("../validators/content_validator");
const {
  approveBookingSchema,
  rejectBookingSchema,
  rescheduleBookingSchema,
} = require("../validators/booking_validator");

const router = express.Router();

// All admin routes require an authenticated admin user.
router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", adminController.getDashboard);

// Users
router.get("/users", adminController.listUsers);
router.post("/users", validateBody(createUserSchema), adminController.createUser);
router.patch("/users/:id", validateBody(updateUserSchema), adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);
router.post(
  "/users/:id/reset-password",
  validateBody(resetPasswordSchema),
  adminController.resetUserPassword
);

// Bookings (admin gets reception actions too, plus hard delete)
router.get("/bookings", adminController.listBookings);
router.get("/bookings/:id", adminController.getBooking);
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
router.delete("/bookings/:id", adminController.deleteBooking);

// Services
router.get("/services", adminController.listServices);
router.post("/services", validateBody(createServiceSchema), adminController.createService);
router.patch("/services/:id", validateBody(updateServiceSchema), adminController.updateService);
router.delete("/services/:id", adminController.deleteService);

// Time slots
router.get("/time-slots", adminController.listTimeSlots);
router.post("/time-slots", validateBody(createSlotSchema), adminController.createTimeSlot);
router.patch("/time-slots/:id", validateBody(updateSlotSchema), adminController.updateTimeSlot);
router.delete("/time-slots/:id", adminController.deleteTimeSlot);

// Testimonials
router.get("/testimonials", adminController.listTestimonials);
router.post(
  "/testimonials",
  validateBody(createTestimonialSchema),
  adminController.createTestimonial
);
router.patch(
  "/testimonials/:id",
  validateBody(updateTestimonialSchema),
  adminController.updateTestimonial
);
router.delete("/testimonials/:id", adminController.deleteTestimonial);

// Email notifications
router.get("/email-notifications", adminController.listEmailNotifications);
router.patch("/email-notifications/:id/retry", adminController.retryEmail);

// Audit logs
router.get("/audit-logs", adminController.listAuditLogs);

module.exports = router;