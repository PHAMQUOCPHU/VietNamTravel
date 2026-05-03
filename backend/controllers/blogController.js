import mongoose from "mongoose";
import blogModel from "../models/blogModel.js";
import userModel from "../models/userModel.js";
import axios from "axios";
import {
  uploadBufferToCloudinary,
  CLOUDINARY_FOLDERS,
} from "../services/cloudinaryUpload.js";

const recentViewTracker = new Map();
const VIEW_THROTTLE_MS = 1500;
const VIEW_TRACKER_MAX_KEYS = 5000;

/** Giảm rò rỉ bộ nhớ khi tracker phình to (in-memory per process). */
const pruneViewTracker = () => {
  while (recentViewTracker.size > VIEW_TRACKER_MAX_KEYS) {
    const firstKey = recentViewTracker.keys().next().value;
    if (firstKey === undefined) break;
    recentViewTracker.delete(firstKey);
  }
};

const buildDateRange = (date) => {
  if (!date) return null;
  const start = new Date(date);
  if (Number.isNaN(start.getTime())) return null;
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.getTime(), end: end.getTime() };
};

const buildListBlogQuery = (req, { publicOnly }) => {
  const { category, date, startDate, endDate, search } = req.query;
  const query = {};
  if (publicOnly) {
    query.isHidden = false;
  }
  if (category && category !== "all") query.category = category;
  if (search != null && String(search).trim()) {
    const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.title = { $regex: escaped, $options: "i" };
  }
  if (date) {
    const range = buildDateRange(date);
    if (range) query.date = { $gte: range.start, $lt: range.end };
  } else if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      const range = buildDateRange(startDate);
      if (range) query.date.$gte = range.start;
    }
    if (endDate) {
      const range = buildDateRange(endDate);
      if (range) query.date.$lt = range.end;
    }
    if (!Object.keys(query.date).length) delete query.date;
  }
  return query;
};

/** Danh sách blog không phân trang (tối đa MAX_BLOG_LIST trả về). */
const MAX_BLOG_LIST = 3000;

const runBlogListAggregation = async (req, res, { publicOnly }) => {
  try {
    const query = buildListBlogQuery(req, { publicOnly });
    const totalItems = await blogModel.countDocuments(query);

    const pipeline = [
      { $match: query },
      { $sort: { date: -1 } },
      { $limit: MAX_BLOG_LIST },
      {
        $project: {
          title: 1,
          excerpt: 1,
          image: 1,
          category: 1,
          author: 1,
          date: 1,
          views: 1,
          isFeatured: 1,
          isHidden: 1,
          commentCount: { $size: { $ifNull: ["$comments", []] } },
        },
      },
    ];
    const blogs = await blogModel.aggregate(pipeline);
    res.json({
      success: true,
      blogs,
      totalItems,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const addBlog = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      category,
      isFeatured = "false",
      isHidden = "false",
      publishDate,
    } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.json({
        success: false,
        message: "Vui lòng chọn ảnh đại diện",
      });
    }

    const imageUrl = await uploadBufferToCloudinary(
      imageFile,
      CLOUDINARY_FOLDERS.blogs,
    );

    const blogData = {
      title,
      excerpt,
      content,
      category,
      isFeatured: isFeatured === "true",
      isHidden: isHidden === "true",
      image: imageUrl,
      date: publishDate ? new Date(publishDate).getTime() : Date.now(),
    };

    const newBlog = new blogModel(blogData);
    await newBlog.save();

    res.json({ success: true, message: "Đã lưu bài viết vào hệ thống!" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/** Cho site public — chỉ bài không ẩn, không kèm content/html comment rười. */
const listPublicBlogs = async (req, res) =>
  runBlogListAggregation(req, res, { publicOnly: true });

/** Cho admin — bao gồm bài đã ẩn nháp / ẩn hiển thị. */
const listAdminBlogs = async (req, res) =>
  runBlogListAggregation(req, res, { publicOnly: false });

const getViewerId = (req) => {
  const headerViewer = req.headers["x-viewer-id"];
  const forwardedFor = req.headers["x-forwarded-for"];
  return (
    headerViewer ||
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) ||
    req.ip ||
    "anonymous"
  );
};

/** Admin chỉnh sửa — trả đủ fields, không tăng lượt xem, cho phép đọc cả bài isHidden */
const getAdminBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: "Không tìm thấy bài viết" });
    }
    const blog = await blogModel.findById(id).lean();
    if (!blog) {
      return res.json({ success: false, message: "Không tìm thấy bài viết" });
    }
    res.json({ success: true, blog });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const { incrementView = "true" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: "Không tìm thấy bài viết" });
    }

    const shouldIncrement = incrementView === "true";

    if (shouldIncrement) {
      const viewerId = getViewerId(req);
      const viewKey = `${id}:${viewerId}`;
      const now = Date.now();
      const lastViewedAt = recentViewTracker.get(viewKey) || 0;

      if (now - lastViewedAt > VIEW_THROTTLE_MS) {
        await blogModel.updateOne(
          { _id: id, isHidden: false },
          { $inc: { views: 1 } },
        );
        recentViewTracker.set(viewKey, now);
        pruneViewTracker();
      }
    }

    const blog = await blogModel.findById(id).lean();
    if (!blog || blog.isHidden) {
      return res.json({ success: false, message: "Không tìm thấy bài viết" });
    }

    res.json({ success: true, blog });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const COMMENT_MAX_LENGTH = 1000;

const addBlogComment = async (req, res) => {
  try {
    const { id } = req.params;
    let { content } = req.body;

    if (!content || !content.trim()) {
      return res.json({ success: false, message: "Nội dung bình luận không hợp lệ" });
    }

    content = content.trim().slice(0, COMMENT_MAX_LENGTH);

    const user = await userModel.findById(req.userId).select("name");
    if (!user) {
      return res.status(401).json({ success: false, message: "Người dùng không hợp lệ" });
    }

    const blog = await blogModel.findOne({ _id: id, isHidden: false });
    if (!blog) {
      return res.json({ success: false, message: "Không tìm thấy bài viết" });
    }

    blog.comments.unshift({
      userId: req.userId,
      userName: user.name || "Người dùng",
      content,
    });
    await blog.save();

    res.json({ success: true, message: "Đã thêm bình luận", comments: blog.comments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: "Id bài viết không hợp lệ" });
    }

    const deleted = await blogModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.json({ success: false, message: "Không tìm thấy bài viết" });
    }

    res.json({ success: true, message: "Đã xóa bài viết thành công" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: "Id bài viết không hợp lệ" });
    }
    const {
      title,
      excerpt,
      content,
      category,
      isFeatured = "false",
      isHidden = "false",
      publishDate,
    } = req.body;
    const imageFile = req.file;

    const blog = await blogModel.findById(id);
    if (!blog) {
      return res.json({ success: false, message: "Không tìm thấy bài viết" });
    }

    const updateData = {
      title,
      excerpt,
      content,
      category,
      isFeatured: isFeatured === "true",
      isHidden: isHidden === "true",
      date: publishDate ? new Date(publishDate).getTime() : blog.date,
    };

    if (imageFile) {
      updateData.image = await uploadBufferToCloudinary(
        imageFile,
        CLOUDINARY_FOLDERS.blogs,
      );
    }

    await blogModel.findByIdAndUpdate(id, updateData);

    res.json({ success: true, message: "Cập nhật bài viết thành công" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const toggleBlogVisibility = async (req, res) => {
  try {
    const { id, isHidden } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: "Id bài viết không hợp lệ" });
    }
    const blog = await blogModel.findByIdAndUpdate(
      id,
      { isHidden: Boolean(isHidden) },
      { new: true },
    );
    if (!blog) {
      return res.json({ success: false, message: "Không tìm thấy bài viết" });
    }
    res.json({
      success: true,
      message: blog.isHidden ? "Đã ẩn bài viết" : "Đã hiển thị lại bài viết",
      blog,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const generateBlogWithAI = async (req, res) => {
  try {
    const {
      topic,
      category,
      tone = "than thien",
      keywords = "",
      length = "vua",
      offlineMode = false,
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.json({ success: false, message: "Vui long nhap chu de bai viet" });
    }

    const prompt = `
Ban la content writer cho website du lich Viet Nam.
Hay viet mot bai dang blog bang tieng Viet va tra ve dung JSON (khong markdown, khong text thua) theo schema:
{
  "title": "string",
  "excerpt": "string",
  "contentHtml": "string"
}

Yeu cau:
- Chu de: ${topic}
- Chuyen muc: ${category || "du lich"}
- Giong van: ${tone}
- Tu khoa uu tien: ${keywords || "khong co"}
- Do dai: ${length}
- contentHtml dung the <h2>, <p>, <ul>, <li>, <strong> de render bang ReactQuill.
- excerpt toi da 220 ky tu.
- Noi dung huu ich, co cau truc ro rang, khong chep van mau.
`.trim();

    const buildFallbackDraft = () => {
      const niceCategory = category || "du lich";
      const keywordText = keywords ? `Tu khoa uu tien: ${keywords}.` : "";
      const title = `Goi y hanh trinh: ${topic.trim()}`;
      const excerpt = `Tong hop kinh nghiem ${niceCategory} ve "${topic.trim()}": thoi diem dep, chi phi du kien, lich trinh goi y va meo tranh sai lam thuong gap.`;
      const contentHtml = `
<h2>Vi sao chu de nay dang duoc quan tam?</h2>
<p><strong>${topic.trim()}</strong> la chu de du lich duoc tim kiem nhieu trong thoi gian gan day. Bai viet nay cung cap thong tin thuc te, de ap dung va toi uu chi phi.</p>
<p>${keywordText}</p>

<h2>Lich trinh goi y nhanh</h2>
<ul>
  <li><strong>Ngay 1:</strong> Kham pha cac diem noi bat, uu tien cac dia diem gan nhau de tiet kiem thoi gian di chuyen.</li>
  <li><strong>Ngay 2:</strong> Trai nghiem am thuc dia phuong va hoat dong dac trung theo mua.</li>
  <li><strong>Ngay 3:</strong> Diem check-in nhe, mua qua va tro ve.</li>
</ul>

<h2>Du tru chi phi tham khao</h2>
<ul>
  <li>Di chuyen: 500.000 - 1.500.000d</li>
  <li>Luu tru: 400.000 - 1.200.000d/dem</li>
  <li>An uong: 250.000 - 600.000d/ngay</li>
  <li>Ve tham quan: 100.000 - 500.000d</li>
</ul>

<h2>Meo toi uu trai nghiem</h2>
<p>Dat dich vu som, uu tien khung gio vang de tranh dong, va luon co phuong an du phong khi thoi tiet xau. Neu di theo nhom, hay thong nhat ngan sach ngay tu dau de de quan ly chi tieu.</p>
`.trim();
      return { title, excerpt, contentHtml };
    };

    const isOfflineDemoMode =
      offlineMode === true ||
      offlineMode === "true" ||
      process.env.AI_OFFLINE_MODE === "true";

    if (isOfflineDemoMode) {
      return res.json({
        success: true,
        message: "Dang o che do demo offline, da tao nhap bai local.",
        data: buildFallbackDraft(),
        source: "offline-demo",
      });
    }

    const parseGeminiResponse = (rawText = "") => {
      const cleaned = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const jsonText =
        start !== -1 && end !== -1 && end >= start
          ? cleaned.slice(start, end + 1)
          : cleaned;

      return JSON.parse(jsonText || "{}");
    };

    const callGemini = async () => {
      if (!process.env.GEMINI_API_KEY) return null;
      const candidateModels = [
        process.env.GEMINI_MODEL || "gemini-2.0-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-001",
        "gemini-flash-latest",
      ];
      const uniqueModels = [...new Set(candidateModels)];

      let lastError = null;
      for (const model of uniqueModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const response = await axios.post(
            url,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
              },
            },
            { headers: { "Content-Type": "application/json" } },
          );

          const raw =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          const parsed = parseGeminiResponse(raw);
          if (!parsed.title || !parsed.excerpt || !parsed.contentHtml) {
            throw new Error("GEMINI_INVALID_RESPONSE");
          }

          return {
            title: parsed.title.trim(),
            excerpt: parsed.excerpt.trim(),
            contentHtml: parsed.contentHtml.trim(),
          };
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error("GEMINI_CALL_FAILED");
    };

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        message: "Chua co GEMINI_API_KEY, he thong da tao nhap bai mau local.",
        data: buildFallbackDraft(),
        source: "fallback",
      });
    }

    const geminiData = await callGemini();

    return res.json({
      success: true,
      message: "Da tao nhap bai viet bang Gemini AI",
      data: geminiData,
      source: "gemini",
    });
  } catch (error) {
    console.log(error?.response?.data || error.message);
    const title = `Goi y nhanh: ${req.body.topic || "hanh trinh du lich Viet Nam"}`;
    const excerpt =
      "Gemini tam thoi khong kha dung, he thong tao ban nhap de ban chinh sua nhanh va dang bai ngay.";
    const contentHtml = `
<h2>Ban nhap nhanh khi Gemini loi</h2>
<p>He thong da tao noi dung tam de khong gian doan cong viec. Ban co the sua lai tieu de, bo cuc va bo sung du lieu thuc te truoc khi dang.</p>
<h2>Khung noi dung goi y</h2>
<ul>
  <li>Gioi thieu diem den va ly do nen di.</li>
  <li>Lich trinh 2-3 ngay de tham khao.</li>
  <li>Du tru chi phi, meo tiet kiem, canh bao can luu y.</li>
</ul>
<p><strong>Luu y:</strong> Kiem tra lai GEMINI_API_KEY va han muc su dung neu muon tao bai day du bang AI.</p>
`.trim();

    return res.json({
      success: true,
      message: "Gemini tam thoi loi, da tao ban nhap local de ban tiep tuc.",
      data: { title, excerpt, contentHtml },
      source: "fallback",
    });
  }
};

export {
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
};
