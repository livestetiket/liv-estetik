const express = require("express");
const { requireAuth } = require("../middleware/auth_middleware");
const controller = require("../controllers/notification_controller");

const router = express.Router();
router.use(requireAuth);
router.get("/", controller.listNotifications);
router.patch("/read-all", controller.markAllRead);
router.patch("/:id/read", controller.markRead);
module.exports = router;
