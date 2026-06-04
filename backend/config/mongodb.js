import dns from "dns";
import mongoose from "mongoose";

// Windows đôi khi không resolve được SRV của Atlas (querySrv ECONNREFUSED).
if (process.platform === "win32") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || typeof uri !== "string" || !uri.trim()) {
    throw new Error(
      "Thiếu MONGO_URI trong .env. Thêm chuỗi kết nối MongoDB (Atlas hoặc local).",
    );
  }

  mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB");
  });

  try {
    await mongoose.connect(uri.trim(), {
      serverSelectionTimeoutMS: 15_000,
    });
  } catch (err) {
    const name = err?.name || "";
    const isAtlas =
      uri.includes("mongodb.net") || uri.includes("mongodb+srv");
    if (name === "MongooseServerSelectionError" || isAtlas) {
      console.error("\n--- Lỗi kết nối MongoDB ---");
      console.error(err.message);
      console.error(
        "\nNếu dùng MongoDB Atlas: Network Access → thêm IP máy bạn (hoặc 0.0.0.0/0 chỉ để dev).",
      );
      console.error(
        "Kiểm tra user/password trong URI và Database Access trên Atlas.\n",
      );
    }
    throw err;
  }
};

export default connectDB;
