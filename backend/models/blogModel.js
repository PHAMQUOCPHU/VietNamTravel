import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    userName: { type: String, required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    author: { type: String, default: "Admin" },
    date: { type: Number, required: true },
    views: { type: Number, default: 0 },
    comments: { type: [commentSchema], default: [] },
  },
  { minimize: false },
);

const blogModel = mongoose.models.blog || mongoose.model("blog", blogSchema);
export default blogModel;
