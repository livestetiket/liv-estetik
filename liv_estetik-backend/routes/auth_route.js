const express = require("express");
const authController = require("../controllers/auth_controller");
const { requireAuth } = require("../middleware/auth_middleware");
const { validateBody } = require("../middleware/validate_middleware");
const { 
  loginSchema, 
  changeEmailSchema, 
  changePasswordSchema 
} = require("../validators/user_validator");
const { loginLimiter } = require("../middleware/rate_limit_middleware");

const router = express.Router();

router.post("/login", loginLimiter, validateBody(loginSchema), authController.login);
router.get("/me", requireAuth, authController.me);
router.post(
  "/change-email",
  requireAuth,
  validateBody(changeEmailSchema),
  authController.changeEmail
);
router.post(
  "/change-password",
  requireAuth,
  validateBody(changePasswordSchema),
  authController.changePassword
);

module.exports = router;