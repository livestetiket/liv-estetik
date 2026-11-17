const User = require("../models/user");
const Notification = require("../models/notification");

async function notifyRoles({ roles = ["admin", "reception"], eventKey, eventType, title, message, entityType, entityId }) {
  try {
    const users = await User.find({ role: { $in: roles }, active: true }).select("_id").lean();
    if (!users.length) return;
    await Notification.bulkWrite(users.map(({ _id }) => ({
      updateOne: {
        filter: { recipient: _id, eventKey },
        update: { $setOnInsert: { recipient: _id, eventKey, eventType, title, message, entityType, entityId } },
        upsert: true,
      },
    })), { ordered: false });
  } catch (error) {
    // Notifications must not undo a successfully saved patient or booking.
    console.error(`[notification] Could not persist ${eventType}: ${error.message}`);
  }
}

async function notifyUser({ userId, eventKey, eventType, title, message, entityType, entityId }) {
  if (!userId) return;
  try {
    await Notification.updateOne(
      { recipient: userId, eventKey },
      { $setOnInsert: { recipient: userId, eventKey, eventType, title, message, entityType, entityId } },
      { upsert: true },
    );
  } catch (error) {
    console.error(`[notification] Could not persist ${eventType}: ${error.message}`);
  }
}

module.exports = { notifyRoles, notifyUser };
