const Notification = require("../models/notification");
const ApiError = require("../util/api_error");
const asyncHandler = require("../util/async_handler");

const listNotifications = asyncHandler(async (req, res) => {
  const [rows, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(100).lean(),
    Notification.countDocuments({ recipient: req.user.id, readAt: null }),
  ]);
  res.json({ data: { notifications: rows, unreadCount } });
});

const markRead = asyncHandler(async (req, res) => {
  const row = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user.id }, { $set: { readAt: new Date() } }, { new: true });
  if (!row) throw ApiError.notFound("Notification not found");
  res.json({ data: row });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user.id, readAt: null }, { $set: { readAt: new Date() } });
  res.json({ data: { unreadCount: 0 } });
});

module.exports = { listNotifications, markRead, markAllRead };
