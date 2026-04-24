/**
 * Chạy một lần để bỏ unique index cũ trên trường title của tours:
 *   node backend/scripts/migrateTourDropUniqueTitleIndex.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/mongodb.js";

const run = async () => {
  await connectDB();
  const coll = mongoose.connection.collection("tours");
  const indexes = await coll.indexes();
  const hasTitleIndex = indexes.some((idx) => idx?.name === "title_1");

  if (!hasTitleIndex) {
    console.log("Index title_1 không tồn tại, bỏ qua.");
    process.exit(0);
  }

  await coll.dropIndex("title_1");
  console.log("Đã drop index title_1.");
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
