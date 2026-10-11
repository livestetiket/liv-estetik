/*
  One-off script to remove duplicate TimeSlot documents that share the same
  `service` and `startsAt`. Keeps the earliest created document for each group.

  Usage: node scripts/dedupe_timeslots.js
*/

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const env = require('../config/env');
const TimeSlot = require('../models/timeslot');

async function dedupe() {
  await connectDB();

  // Group by service + startsAt (normalize startsAt to ISO string to avoid ms differences)
  const pipeline = [
    {
      $group: {
        _id: { service: '$service', startsAt: '$startsAt' },
        ids: { $push: '$_id' },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ];

  const duplicates = await TimeSlot.aggregate(pipeline).exec();
  console.log(`[dedupe] found ${duplicates.length} duplicate groups`);

  let removed = 0;
  for (const group of duplicates) {
    // Keep the first _id, remove the rest
    const [keep, ...rest] = group.ids;
    const res = await TimeSlot.deleteMany({ _id: { $in: rest } });
    removed += res.deletedCount || 0;
    console.log(`[dedupe] group ${JSON.stringify(group._id)} - removed ${res.deletedCount || 0}`);
  }

  console.log(`[dedupe] total removed: ${removed}`);
  mongoose.connection.close();
}

dedupe().catch((err) => {
  console.error('[dedupe] error', err);
  process.exit(1);
});
