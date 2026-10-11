const express = require("express");
const publicController = require("../controllers/public_controller");
const { validateBody } = require("../middleware/validate_middleware");
const { createBookingSchema } = require("../validators/booking_validator");
const { createMessageSchema } = require("../validators/content_validator");
const { publicWriteLimiter } = require("../middleware/rate_limit_middleware");

const router = express.Router();

router.get("/services", publicController.getServices);
router.get("/testimonials", publicController.getTestimonials);
router.get("/time-slots", publicController.getTimeSlots);

router.post(
  "/bookings",
  publicWriteLimiter,
  validateBody(createBookingSchema),
  publicController.createBooking
);

router.post(
  "/messages",
  publicWriteLimiter,
  validateBody(createMessageSchema),
  publicController.createMessage
);

module.exports = router;