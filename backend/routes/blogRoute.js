import express from "express";
import {
  addBlog,
  listPublicBlogs,
  listAdminBlogs,
  getAdminBlogById,
  getBlogById,
  addBlogComment,
  deleteBlog,
  updateBlog,
  toggleBlogVisibility,
  generateBlogWithAI,
} from "../controllers/blogController.js";
import upload from "../middlewares/multer.js";
import adminAuth from "../middlewares/adminAuth.js";
import authMiddleware from "../middlewares/auth.js";

const blogRouter = express.Router();

blogRouter.post("/add-blog", adminAuth, upload.single("image"), addBlog);
blogRouter.post("/generate-ai", adminAuth, generateBlogWithAI);

blogRouter.get("/list-blogs", listPublicBlogs);
blogRouter.get("/admin/list-blogs", adminAuth, listAdminBlogs);
blogRouter.get("/admin/detail/:id", adminAuth, getAdminBlogById);

blogRouter.get("/:id", getBlogById);
blogRouter.post("/:id/comments", authMiddleware, addBlogComment);

blogRouter.post("/delete-blog", adminAuth, deleteBlog);
blogRouter.post("/toggle-visibility", adminAuth, toggleBlogVisibility);

blogRouter.post(
  "/update-blog/:id",
  adminAuth,
  upload.single("image"),
  updateBlog,
);

export default blogRouter;
