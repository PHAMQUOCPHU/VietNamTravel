/**
 * Các bước hướng dẫn driver.js — phụ thuộc trạng thái đăng nhập (thiếu #nav-bookings / chuông sẽ lỗi highlight).
 * @param {{ user: object | null }} opts
 */
export const getTourSteps = ({ user } = {}) => {
  const isLoggedIn = Boolean(user);

  const steps = [
    {
      element: "#step-header-container",
      popover: {
        title: "Xin chào bạn! 👋",
        description:
          "Chào mừng bạn đến với VietNam Travel! Mình là Miu — người bạn đồng hành ảo của bạn. Rất vui được đưa bạn dạo quanh một vòng để khám phá những điều thú vị tại đây. Chúng ta bắt đầu nhé!",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: "#nav-home",
      popover: {
        title: "Trang chủ",
        description:
          "Đây là trạm dừng chân đầu tiên, nơi bạn cập nhật nhanh xu hướng du lịch và các chương trình ưu đãi nổi bật nhất.",
        side: "bottom",
      },
    },
    {
      element: "#nav-about",
      popover: {
        title: "Giới thiệu — About",
        description:
          "Vào đây để biết thêm về VietNam Travel: sứ mệnh của chúng mình, đội ngũ và cam kết mang đến hành trình an toàn, trọn vẹn cho bạn. Rất phù hợp nếu bạn lần đầu ghé thăm website!",
        side: "bottom",
      },
    },
    {
      element: "#nav-blogs",
      popover: {
        title: "Cẩm nang du lịch",
        description:
          "Nếu bạn đang tìm kinh nghiệm ăn chơi hay bí kíp chụp ảnh, đừng bỏ lỡ góc chia sẻ từ những lữ khách đam mê xê dịch tại đây nhé!",
        side: "bottom",
      },
    },
    {
      element: "#nav-tours",
      popover: {
        title: "Khám phá điểm đến",
        description:
          "Thiên đường của những chuyến đi: tour từ vùng cao Đông Bắc đến miền Tây sông nước đang chờ bạn lựa chọn.",
        side: "bottom",
      },
    },
  ];

  if (isLoggedIn) {
    steps.push({
      element: "#nav-bookings",
      popover: {
        title: "Hành trình của bạn",
        description:
          "Toàn bộ tour bạn đã đặt và trạng thái chuyến đi được lưu gọn tại đây — xem lại bất cứ lúc nào.",
        side: "bottom",
      },
    });
    steps.push({
      element: () => {
        const desktop = document.getElementById("nav-notifications");
        const mobile = document.getElementById("nav-notifications-mobile");
        const wide = window.matchMedia("(min-width: 768px)").matches;
        if (wide) return desktop || mobile;
        return mobile || desktop;
      },
      popover: {
        title: "Chuông thông báo",
        description:
          "Nhấn vào chuông để xem thông báo mới: nhắc lịch khởi hành, cập nhật booking, khuyến mãi… Số đỏ trên chuông là tin chưa đọc. Bạn cũng có thể vào “Xem tất cả” để mở trang thông báo đầy đủ.",
        side: "bottom",
        align: "end",
      },
    });
  }

  steps.push({
    element: "#chat-button",
    popover: {
      title: "Chúng mình luôn lắng nghe 💬",
      description:
        "Cuối cùng, nếu cần trợ giúp hoặc muốn thiết kế hành trình riêng, hãy nhấn đây để trò chuyện với đội hỗ trợ. Chúc bạn những trải nghiệm tuyệt vời cùng VietNam Travel!",
      side: "left",
      align: "end",
    },
  });

  return steps;
};
