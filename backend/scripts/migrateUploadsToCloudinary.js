import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../config/mongodb.js";
import connectCloudinary from "../config/cloudinary.js";
import tourModel from "../models/TourModel.js";
import blogModel from "../models/blogModel.js";
import {
  uploadBufferToCloudinary,
  CLOUDINARY_FOLDERS,
} from "../services/cloudinaryUpload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../uploads");

const isCloudinaryUrl = (value = "") =>
  typeof value === "string" && value.startsWith("http");

const readLocalUploadFile = async (fileName) => {
  const filePath = path.join(uploadsDir, fileName);
  const buffer = await fs.readFile(filePath);
  return {
    buffer,
    originalname: fileName,
    mimetype: "image/*",
  };
};

const migrateTours = async () => {
  const tours = await tourModel.find({}, "title images image").lean();
  let updated = 0;

  for (const tour of tours) {
    const baseSourceImages =
      Array.isArray(tour.images) && tour.images.length > 0
        ? tour.images
      : tour.image
        ? [tour.image]
        : [];
    if (!baseSourceImages.length) continue;

    const sourceImages = [...baseSourceImages];
    while (sourceImages.length < 3) {
      sourceImages.push(sourceImages[sourceImages.length - 1]);
    }

    const migratedImages = [];
    const migratedCache = new Map();
    for (const image of sourceImages.slice(0, 3)) {
      if (isCloudinaryUrl(image)) {
        migratedImages.push(image);
        continue;
      }

      if (migratedCache.has(image)) {
        migratedImages.push(migratedCache.get(image));
        continue;
      }

      try {
        const file = await readLocalUploadFile(image);
        const cloudUrl = await uploadBufferToCloudinary(
          file,
          CLOUDINARY_FOLDERS.tours,
        );
        migratedCache.set(image, cloudUrl);
        migratedImages.push(cloudUrl);
      } catch (error) {
        console.log(`[tour:${tour._id}] skip image '${image}': ${error.message}`);
      }
    }

    if (
      migratedImages.length > 0 &&
      JSON.stringify(migratedImages) !== JSON.stringify(tour.images || [])
    ) {
      await tourModel.updateOne(
        { _id: tour._id },
        { $set: { images: migratedImages } },
      );
      updated += 1;
    }
  }

  return updated;
};

const migrateBlogs = async () => {
  const blogs = await blogModel.find({});
  let updated = 0;

  for (const blog of blogs) {
    if (!blog.image || isCloudinaryUrl(blog.image)) continue;
    try {
      const file = await readLocalUploadFile(blog.image);
      const cloudUrl = await uploadBufferToCloudinary(
        file,
        CLOUDINARY_FOLDERS.blogs,
      );
      blog.image = cloudUrl;
      await blog.save();
      updated += 1;
    } catch (error) {
      console.log(`[blog:${blog._id}] skip image '${blog.image}': ${error.message}`);
    }
  }

  return updated;
};

const run = async () => {
  await connectDB();
  await connectCloudinary();

  const updatedTours = await migrateTours();
  const updatedBlogs = await migrateBlogs();

  console.log(`Migrated tours: ${updatedTours}`);
  console.log(`Migrated blogs: ${updatedBlogs}`);
  process.exit(0);
};

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
