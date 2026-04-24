/**
 * Chạy một lần sau khi deploy schema mới (bỏ season, đổi enum category):
 *   node backend/scripts/migrateTourRemoveSeasonAndCategories.js
 *
 * - Xóa trường season trên mọi tour
 * - Chuẩn hóa category cũ → loại hình mới
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/mongodb.js";
import {
  TOUR_CATEGORY_ENUM,
  LEGACY_TOUR_CATEGORY_MAP,
  normalizeTourCategory,
} from "../constants/tourCategories.js";

const run = async () => {
  await connectDB();
  const coll = mongoose.connection.collection("tours");

  const unset = await coll.updateMany({}, { $unset: { season: "" } });
  console.log("Unset season:", unset.modifiedCount);

  for (const [from, to] of Object.entries(LEGACY_TOUR_CATEGORY_MAP)) {
    const r = await coll.updateMany({ category: from }, { $set: { category: to } });
    if (r.modifiedCount) console.log(`  ${from} → ${to}: ${r.modifiedCount}`);
  }

  const cursor = coll.find({
    category: { $nin: TOUR_CATEGORY_ENUM },
  });
  let fixed = 0;
  for await (const doc of cursor) {
    const next = normalizeTourCategory(doc.category);
    await coll.updateOne({ _id: doc._id }, { $set: { category: next } });
    fixed += 1;
  }
  if (fixed) console.log("Fallback category fixes:", fixed);

  console.log("Migration done.");
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
