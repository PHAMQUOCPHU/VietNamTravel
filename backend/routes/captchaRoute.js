import express from "express";
import svgCaptcha from "svg-captcha";

const router = express.Router();

// SỬA TẠI ĐÂY: Để trống đường dẫn vì server.js đã định nghĩa tiền tố rồi
router.get("/", (req, res) => {
  const captcha = svgCaptcha.create({
    size: 6,
    noise: 3,
    color: true,
    background: "#ffffff",
    width: 150,
    height: 50,
    fontSize: 50,
  });

  // Gửi về cho Frontend xử lý
  res.status(200).send({
    success: true,
    text: captcha.text,
    data: captcha.data,
  });
});

export default router;
