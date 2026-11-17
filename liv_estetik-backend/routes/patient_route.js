const express = require("express");
const { requireAuth } = require("../middleware/auth_middleware");
const { requireRole } = require("../middleware/role_middleware");
const { validateBody } = require("../middleware/validate_middleware");
const { createPatientSchema, updatePatientSchema, updatePrpSessionSchema } = require("../validators/patient_validator");
const controller = require("../controllers/patient_controller");

const router = express.Router();
router.use(requireAuth, requireRole("reception", "admin"));
router.get("/lookup", controller.lookupPatient);
router.get("/", controller.listPatients);
router.post("/", validateBody(createPatientSchema), controller.createPatient);
router.get("/:id", controller.getPatient);
router.patch("/:id", validateBody(updatePatientSchema), controller.updatePatient);
router.post("/:id/prp-courses", controller.createPrpCourse);
router.patch("/:id/prp-courses/:courseId/sessions/:sessionNumber", validateBody(updatePrpSessionSchema), controller.updatePrpSession);

module.exports = router;
