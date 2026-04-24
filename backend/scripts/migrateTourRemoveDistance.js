/**
 * Chạy một lần sau khi bỏ trường distance khỏi schema tour:
 *   node backend/scripts/migrateTourRemoveDistance.js
 *
 * - Xóa trường distance trên mọi document trong collection tours
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/mongodb.js";

const run = async () => {
  await connectDB();
  const coll = mongoose.connection.collection("tours");
  const r = await coll.updateMany({}, { $unset: { distance: "" } });
  console.log("Unset distance on tours:", r.modifiedCount);
  console.log("Migration done.");
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
