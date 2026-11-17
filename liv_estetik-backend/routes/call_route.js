const express = require("express");
const { requireAuth } = require("../middleware/auth_middleware");
const { requireRole } = require("../middleware/role_middleware");
const { validateBody } = require("../middleware/validate_middleware");
const { createCallSchema, updateCallSchema } = require("../validators/activity_validator");
const controller = require("../controllers/operations_controller");

const router = express.Router();
router.use(requireAuth, requireRole("admin", "call_center_agent"));
router.get("/", controller.listCalls);
router.post("/", validateBody(createCallSchema), controller.createCall);
router.patch("/:id", validateBody(updateCallSchema), controller.updateCall);
module.exports = router;
