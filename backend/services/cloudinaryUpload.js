import { v2 as cloudinary } from "cloudinary";

/** Thư mục Cloudinary (Media Library) — dùng dấu gạch ngang cho dễ đọc */
export const CLOUDINARY_FOLDERS = {
  tours: "vietnam-travel/tours",
  blogs: "vietnam-travel/blogs",
  avatars: "vietnam-travel/avatars",
  reviews: "vietnam-travel/reviews",
};

export const uploadBufferToCloudinary = async (
  file,
  folder = CLOUDINARY_FOLDERS.tours,
) => {
  if (!file?.buffer) {
    throw new Error("UPLOAD_BUFFER_NOT_FOUND");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || "");
      },
    );
    stream.end(file.buffer);
  });
};
